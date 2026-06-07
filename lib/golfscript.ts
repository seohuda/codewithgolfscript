/**
 * A self-contained GolfScript interpreter (TypeScript).
 *
 * Implemented because the public Piston API became whitelist-only.
 * This runs entirely in-process — no external execution backend.
 *
 * Supported types: integer, string, array, block.
 * Supported features: the GolfScript tokenizer, variable assignment,
 * blocks, and the most common operators used for golfing
 * (~ ` ! @ $ + - * / % | & ^ < > = , . ? ( ) [ ] : ; \ and more).
 *
 * It is not a 100% complete implementation of every GolfScript edge
 * case, but it correctly handles the standard idioms used to solve
 * typical short-coding problems.
 */

export type GSType = "num" | "str" | "arr" | "block";

export interface GSVal {
  t: GSType;
  n?: number; // num
  s?: string; // str
  a?: GSVal[]; // arr
  b?: Token[]; // block tokens
  src?: string; // block source text
}

export type Token = string | { block: Token[]; src: string };

export interface RunResult {
  stdout: string;
  error: string | null;
}

const TYPE_ORDER: Record<GSType, number> = {
  num: 0,
  arr: 1,
  str: 2,
  block: 3,
};

// ----------------------------------------------------------------------
// Value constructors
// ----------------------------------------------------------------------
const num = (n: number): GSVal => ({ t: "num", n: Math.trunc(n) });
const str = (s: string): GSVal => ({ t: "str", s });
const arr = (a: GSVal[]): GSVal => ({ t: "arr", a });
const block = (b: Token[], src: string): GSVal => ({ t: "block", b, src });

function isTruthy(v: GSVal): boolean {
  switch (v.t) {
    case "num":
      return (v.n ?? 0) !== 0;
    case "str":
      return (v.s ?? "").length > 0;
    case "arr":
      return (v.a ?? []).length > 0;
    case "block":
      return (v.src ?? "").length > 0;
  }
}

// ----------------------------------------------------------------------
// Tokenizer
// ----------------------------------------------------------------------
const TOKEN_RE =
  /#[^\n\r]*|"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|-?[0-9]+|[a-zA-Z_][a-zA-Z0-9_]*|:|;|\s+|./g;

export function tokenize(code: string): Token[] {
  const flat: string[] = [];
  const matches = code.match(TOKEN_RE) ?? [];
  for (const m of matches) {
    if (m.length === 0) continue;
    if (/^\s+$/.test(m)) continue; // whitespace separates tokens
    if (m[0] === "#") continue; // comment
    flat.push(m);
  }
  return buildBlocks(flat, { i: 0 }, false);
}

function buildBlocks(
  flat: string[],
  cursor: { i: number },
  nested: boolean,
): Token[] {
  const out: Token[] = [];
  while (cursor.i < flat.length) {
    const tok = flat[cursor.i];
    if (tok === "{") {
      cursor.i++;
      const start = cursor.i;
      const inner = buildBlocks(flat, cursor, true);
      const src = reconstructSrc(flat, start, cursor.i - 1);
      out.push({ block: inner, src });
    } else if (tok === "}") {
      cursor.i++;
      if (nested) return out;
      // Unbalanced close brace: ignore.
    } else {
      out.push(tok);
      cursor.i++;
    }
  }
  return out;
}

function reconstructSrc(flat: string[], start: number, endExclusive: number): string {
  const parts: string[] = [];
  for (let i = start; i < endExclusive; i++) {
    parts.push(flat[i]);
  }
  return parts.join(" ");
}

// ----------------------------------------------------------------------
// String literal parsing (escapes)
// ----------------------------------------------------------------------
function parseStringLiteral(tok: string): string {
  const quote = tok[0];
  let body = tok.slice(1);
  if (body.endsWith(quote)) body = body.slice(0, -1);

  if (quote === "'") {
    // Single quotes: only \\ and \' are escapes.
    return body.replace(/\\(['\\])/g, "$1");
  }
  // Double quotes: standard escapes.
  return body.replace(/\\(.)/g, (_m, c) => {
    switch (c) {
      case "n":
        return "\n";
      case "t":
        return "\t";
      case "r":
        return "\r";
      case "0":
        return "\0";
      case '"':
        return '"';
      case "\\":
        return "\\";
      default:
        return c;
    }
  });
}

// ----------------------------------------------------------------------
// Display / output conversion
// ----------------------------------------------------------------------
export function gsToDisplay(v: GSVal): string {
  switch (v.t) {
    case "num":
      return String(v.n ?? 0);
    case "str":
      return v.s ?? "";
    case "arr":
      return (v.a ?? []).map(gsToDisplay).join("");
    case "block":
      return "{" + (v.src ?? "") + "}";
  }
}

// "Inspect" form used by the ` operator.
function gsInspect(v: GSVal): string {
  switch (v.t) {
    case "num":
      return String(v.n ?? 0);
    case "str":
      return JSON.stringify(v.s ?? "");
    case "arr":
      return "[" + (v.a ?? []).map(gsInspect).join(" ") + "]";
    case "block":
      return "{" + (v.src ?? "") + "}";
  }
}

// ----------------------------------------------------------------------
// Coercion
// ----------------------------------------------------------------------
function toArr(v: GSVal): GSVal[] {
  switch (v.t) {
    case "num":
      return [v];
    case "str":
      return (v.s ?? "").split("").map((c) => num(c.charCodeAt(0)));
    case "arr":
      return v.a ?? [];
    case "block":
      return [v];
  }
}

function coercePair(a: GSVal, b: GSVal): [GSVal, GSVal, GSType] {
  const target = TYPE_ORDER[a.t] >= TYPE_ORDER[b.t] ? a.t : b.t;
  return [coerceTo(a, target), coerceTo(b, target), target];
}

function coerceTo(v: GSVal, target: GSType): GSVal {
  if (v.t === target) return v;
  switch (target) {
    case "arr":
      return arr(toArr(v));
    case "str":
      return str(gsToDisplay(v));
    case "block": {
      if (v.t === "block") return v;
      const src = v.t === "str" ? (v.s ?? "") : gsToDisplay(v);
      return block(tokenize(src), src);
    }
    default:
      return v;
  }
}

// ----------------------------------------------------------------------
// Interpreter
// ----------------------------------------------------------------------

// Hard cap on the size of any single string or array a program can
// build in one operation. Without this, expressions like `1e9,` or
// `"x"1e9*` would allocate gigabytes and exhaust server memory in a
// single step (the step guard only runs between tokens). This bounds
// memory-based DoS regardless of how the judge is hosted.
const MAX_COLLECTION = 5_000_000;

class Interpreter {
  stack: GSVal[] = [];
  vars: Map<string, GSVal> = new Map();
  markStack: number[] = [];
  steps = 0;
  readonly maxSteps: number;
  readonly deadline: number;

  constructor(maxSteps: number, timeoutMs: number) {
    this.maxSteps = maxSteps;
    this.deadline = Date.now() + timeoutMs;
    this.vars.set("n", str("\n"));
  }

  private guard() {
    this.steps++;
    if (this.steps > this.maxSteps) {
      throw new GolfError("Step limit exceeded", true);
    }
    if ((this.steps & 1023) === 0 && Date.now() > this.deadline) {
      throw new GolfError("Time limit exceeded", true);
    }
  }

  push(v: GSVal) {
    this.stack.push(v);
  }

  pop(): GSVal {
    const v = this.stack.pop();
    if (v === undefined) throw new GolfError("Stack underflow", false);
    return v;
  }

  run(tokens: Token[]) {
    for (let i = 0; i < tokens.length; i++) {
      this.guard();
      const tok = tokens[i];

      if (typeof tok !== "string") {
        this.push(block(tok.block, tok.src));
        continue;
      }

      // Assignment: ':' consumes the next token as a variable name.
      if (tok === ":") {
        const nameTok = tokens[i + 1];
        i++;
        const top = this.stack[this.stack.length - 1];
        if (top === undefined) throw new GolfError("Stack underflow", false);
        if (typeof nameTok === "string") {
          this.vars.set(nameTok, cloneVal(top));
        }
        continue;
      }

      this.execToken(tok);
    }
  }

  private execToken(tok: string) {
    // Number literal
    if (/^-?[0-9]+$/.test(tok)) {
      this.push(num(parseInt(tok, 10)));
      return;
    }
    // String literal
    if (tok[0] === '"' || tok[0] === "'") {
      this.push(str(parseStringLiteral(tok)));
      return;
    }
    // Variable / builtin name (alphanumeric)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tok)) {
      const v = this.vars.get(tok);
      if (v !== undefined) {
        if (v.t === "block") {
          this.run(v.b ?? []);
        } else {
          this.push(cloneVal(v));
        }
        return;
      }
      // Not a user variable: try built-in word operators
      // (abs, if, do, while, print, p, puts, ...). Unknown = no-op.
      this.execOperator(tok);
      return;
    }
    // Operator
    this.execOperator(tok);
  }

  private execBlockVal(v: GSVal) {
    if (v.t === "block") {
      this.run(v.b ?? []);
    } else {
      this.push(v);
    }
  }

  private execOperator(op: string) {
    switch (op) {
      case "[":
        this.markStack.push(this.stack.length);
        return;
      case "]": {
        const mark = this.markStack.pop() ?? 0;
        const items = this.stack.splice(mark);
        this.push(arr(items));
        return;
      }
      case "~":
        this.opTilde();
        return;
      case "`":
        this.push(str(gsInspect(this.pop())));
        return;
      case "!":
        this.push(num(isTruthy(this.pop()) ? 0 : 1));
        return;
      case "@": {
        const c = this.pop();
        const b = this.pop();
        const a = this.pop();
        this.push(b);
        this.push(c);
        this.push(a);
        return;
      }
      case "\\": {
        const b = this.pop();
        const a = this.pop();
        this.push(b);
        this.push(a);
        return;
      }
      case ";":
        this.pop();
        return;
      case ".": {
        const a = this.pop();
        this.push(a);
        this.push(cloneVal(a));
        return;
      }
      case "+":
        this.opPlus();
        return;
      case "-":
        this.opMinus();
        return;
      case "*":
        this.opStar();
        return;
      case "/":
        this.opSlash();
        return;
      case "%":
        this.opPercent();
        return;
      case "<":
      case ">":
      case "=":
        this.opCompare(op);
        return;
      case ",":
        this.opComma();
        return;
      case "?":
        this.opQuestion();
        return;
      case "(":
        this.opDecrOrUncons(true);
        return;
      case ")":
        this.opDecrOrUncons(false);
        return;
      case "$":
        this.opDollar();
        return;
      case "|":
      case "&":
      case "^":
        this.opSetOp(op);
        return;
      case "if": {
        const f = this.pop();
        const t = this.pop();
        const cond = this.pop();
        this.execBlockVal(isTruthy(cond) ? t : f);
        return;
      }
      case "do": {
        const body = this.pop();
        // GolfScript 'do': run block; block must leave a truthy/falsy
        // value that is consumed each iteration.
        do {
          this.guard();
          this.execBlockVal(body);
          const cond = this.pop();
          if (!isTruthy(cond)) break;
        } while (true);
        return;
      }
      case "while": {
        const body = this.pop();
        const cond = this.pop();
        while (true) {
          this.guard();
          this.execBlockVal(cond);
          if (!isTruthy(this.pop())) break;
          this.execBlockVal(body);
        }
        return;
      }
      case "print": {
        this.outBuffer += gsToDisplay(this.pop());
        return;
      }
      case "p": {
        this.outBuffer += gsInspect(this.pop()) + "\n";
        return;
      }
      case "puts": {
        this.outBuffer += gsToDisplay(this.pop()) + "\n";
        return;
      }
      case "abs": {
        const a = this.pop();
        this.push(num(Math.abs(a.n ?? 0)));
        return;
      }
      case "base": {
        this.opBase();
        return;
      }
      default:
        // Unknown operator: ignore (no-op).
        return;
    }
  }

  // Buffer for explicit print/puts output (prepended to final stack dump).
  outBuffer = "";

  /**
   * `base` operator.
   *  - num base num  → digit array of `num` in the given base (big-endian)
   *  - arr base num  → interpret digit array as a number in the given base
   */
  private opBase() {
    const b = this.pop(); // base
    const a = this.pop(); // value or digit array
    const radix = b.n ?? 0;
    if (radix < 2) {
      this.push(arr([]));
      return;
    }
    if (a.t === "num") {
      let v = Math.abs(Math.trunc(a.n ?? 0));
      const digits: GSVal[] = [];
      if (v === 0) {
        this.push(arr([num(0)]));
        return;
      }
      while (v > 0) {
        digits.unshift(num(v % radix));
        v = Math.floor(v / radix);
      }
      this.push(arr(digits));
      return;
    }
    // array → number
    const items = toArr(a);
    let acc = 0;
    for (const d of items) {
      acc = acc * radix + (d.n ?? 0);
    }
    this.push(num(acc));
  }

  private opTilde() {
    const a = this.pop();
    switch (a.t) {
      case "num":
        this.push(num(-(a.n ?? 0) - 1));
        return;
      case "str":
      case "block": {
        const src = a.t === "str" ? (a.s ?? "") : (a.src ?? "");
        this.run(tokenize(src));
        return;
      }
      case "arr":
        for (const item of a.a ?? []) this.push(item);
        return;
    }
  }

  private opPlus() {
    const b = this.pop();
    const a = this.pop();
    if (a.t === "num" && b.t === "num") {
      this.push(num((a.n ?? 0) + (b.n ?? 0)));
      return;
    }
    const [ca, cb, target] = coercePair(a, b);
    if (target === "str") {
      this.push(str((ca.s ?? "") + (cb.s ?? "")));
    } else if (target === "arr") {
      this.push(arr([...(ca.a ?? []), ...(cb.a ?? [])]));
    } else if (target === "block") {
      const src = (ca.src ?? "") + " " + (cb.src ?? "");
      this.push(block(tokenize(src), src.trim()));
    }
  }

  private opMinus() {
    const b = this.pop();
    const a = this.pop();
    if (a.t === "num" && b.t === "num") {
      this.push(num((a.n ?? 0) - (b.n ?? 0)));
      return;
    }
    // Set difference (array/string).
    const [ca, cb, target] = coercePair(a, b);
    if (target === "arr" || target === "str") {
      const aArr = toArr(ca);
      const bArr = toArr(cb);
      const bKeys = new Set(bArr.map(valKey));
      const filtered = aArr.filter((x) => !bKeys.has(valKey(x)));
      this.push(target === "str" ? str(arrToStr(filtered)) : arr(filtered));
    }
  }

  private opStar() {
    const b = this.pop();
    const a = this.pop();

    // num * num
    if (a.t === "num" && b.t === "num") {
      this.push(num((a.n ?? 0) * (b.n ?? 0)));
      return;
    }

    // Normalize so that `coll` is the sequence and `other` the operand.
    const numVal = a.t === "num" ? a : b.t === "num" ? b : null;
    const seqVal = a.t === "num" ? b : a;

    // sequence * number → repeat
    if (numVal && seqVal.t !== "num" && seqVal.t !== "block") {
      const count = Math.max(0, numVal.n ?? 0);
      if (seqVal.t === "str") {
        const len = (seqVal.s ?? "").length * count;
        if (len > MAX_COLLECTION) {
          throw new GolfError("Result too large", true);
        }
        this.push(str((seqVal.s ?? "").repeat(count)));
      } else {
        const base = seqVal.a ?? [];
        if (base.length * count > MAX_COLLECTION) {
          throw new GolfError("Result too large", true);
        }
        const out: GSVal[] = [];
        for (let i = 0; i < count; i++) out.push(...base);
        this.push(arr(out));
      }
      return;
    }

    // block * number → execute n times ; number * block → same
    if (numVal && (a.t === "block" || b.t === "block")) {
      const blk = a.t === "block" ? a : b;
      const count = Math.max(0, numVal.n ?? 0);
      for (let i = 0; i < count; i++) this.execBlockVal(blk);
      return;
    }

    // sequence * block (or block * sequence) → fold/reduce
    if (
      (a.t !== "num" && b.t === "block") ||
      (a.t === "block" && b.t !== "num")
    ) {
      const blk = a.t === "block" ? a : b;
      const seq = a.t === "block" ? b : a;
      const items = toArr(seq);
      if (items.length === 0) {
        return;
      }
      this.push(items[0]);
      for (let i = 1; i < items.length; i++) {
        this.push(items[i]);
        this.execBlockVal(blk);
      }
      return;
    }

    // sequence * sequence → join
    if (a.t !== "num" && b.t !== "num") {
      const sep = b;
      const seq = a;
      const items = toArr(seq);
      if (items.length === 0) {
        this.push(seq.t === "str" ? str("") : arr([]));
        return;
      }
      // Join with separator.
      let acc: GSVal = items[0];
      for (let i = 1; i < items.length; i++) {
        acc = concatTwo(acc, sep);
        acc = concatTwo(acc, items[i]);
      }
      this.push(acc);
      return;
    }
  }

  private opSlash() {
    const b = this.pop();
    const a = this.pop();

    // num / num → integer division
    if (a.t === "num" && b.t === "num") {
      const d = b.n ?? 0;
      if (d === 0) throw new GolfError("Division by zero", false);
      this.push(num(Math.floor((a.n ?? 0) / d)));
      return;
    }

    // sequence / block → each (iterate, executing the block per element)
    if (b.t === "block" && a.t !== "num") {
      for (const item of toArr(a)) {
        this.push(item);
        this.execBlockVal(b);
      }
      return;
    }

    // sequence / number → split into chunks of given size
    if (a.t !== "num" && b.t === "num") {
      const sizeRaw = b.n ?? 1;
      const size = Math.max(1, Math.abs(sizeRaw));
      const items = toArr(a);
      const chunks: GSVal[] = [];
      for (let i = 0; i < items.length; i += size) {
        const slice = items.slice(i, i + size);
        chunks.push(a.t === "str" ? str(arrToStr(slice)) : arr(slice));
      }
      this.push(arr(chunks));
      return;
    }

    // sequence / sequence → split on separator
    if (a.t !== "num" && b.t !== "num") {
      if (a.t === "str" && b.t === "str") {
        const parts = splitString(a.s ?? "", b.s ?? "");
        this.push(arr(parts.map(str)));
        return;
      }
      const aArr = toArr(a);
      const bArr = toArr(b);
      const parts = splitArray(aArr, bArr);
      this.push(arr(parts.map((p) => arr(p))));
      return;
    }
  }

  private opPercent() {
    const b = this.pop();
    const a = this.pop();

    // num % num → modulo
    if (a.t === "num" && b.t === "num") {
      const d = b.n ?? 0;
      if (d === 0) throw new GolfError("Division by zero", false);
      this.push(num(mod(a.n ?? 0, d)));
      return;
    }

    // sequence % block → map (collect results)
    if (b.t === "block" && a.t !== "num") {
      const items = toArr(a);
      const collected: GSVal[] = [];
      for (const item of items) {
        const before = this.stack.length;
        this.push(item);
        this.execBlockVal(b);
        const produced = this.stack.splice(before);
        collected.push(...produced);
      }
      this.push(a.t === "str" ? str(arrToStr(collected)) : arr(collected));
      return;
    }

    // sequence % number → step (negative reverses)
    if (a.t !== "num" && b.t === "num") {
      const step = b.n ?? 1;
      let items = toArr(a);
      if (step < 0) items = items.slice().reverse();
      const absStep = Math.max(1, Math.abs(step));
      const out: GSVal[] = [];
      for (let i = 0; i < items.length; i += absStep) out.push(items[i]);
      this.push(a.t === "str" ? str(arrToStr(out)) : arr(out));
      return;
    }
  }

  private opCompare(op: string) {
    const b = this.pop();
    const a = this.pop();

    // Indexing: sequence < n / > n  → take/drop
    if (a.t !== "num" && b.t === "num" && op !== "=") {
      const items = toArr(a);
      const k = b.n ?? 0;
      const idx = k < 0 ? items.length + k : k;
      let sliced: GSVal[];
      if (op === "<") sliced = items.slice(0, Math.max(0, idx));
      else sliced = items.slice(Math.max(0, idx));
      this.push(a.t === "str" ? str(arrToStr(sliced)) : arr(sliced));
      return;
    }

    // Index access: sequence = n → element at index
    if (a.t !== "num" && b.t === "num" && op === "=") {
      const items = toArr(a);
      const k = b.n ?? 0;
      const idx = k < 0 ? items.length + k : k;
      const el = items[idx];
      if (el !== undefined) this.push(el);
      return;
    }

    // General comparison.
    const cmp = compareVals(a, b);
    let res: boolean;
    if (op === "<") res = cmp < 0;
    else if (op === ">") res = cmp > 0;
    else res = cmp === 0;
    this.push(num(res ? 1 : 0));
  }

  private opComma() {
    const a = this.pop();
    // num , → range [0, n)
    if (a.t === "num") {
      const n = Math.max(0, a.n ?? 0);
      if (n > MAX_COLLECTION) {
        throw new GolfError("Range too large", true);
      }
      const out: GSVal[] = [];
      for (let i = 0; i < n; i++) out.push(num(i));
      this.push(arr(out));
      return;
    }
    // block ... handled when preceded by array via map/filter; here:
    if (a.t === "block") {
      // filter: needs an array below — but standard form is `arr {blk} ,`
      const seq = this.pop();
      const items = toArr(seq);
      const kept: GSVal[] = [];
      for (const item of items) {
        this.push(item);
        this.execBlockVal(a);
        if (isTruthy(this.pop())) kept.push(item);
      }
      this.push(seq.t === "str" ? str(arrToStr(kept)) : arr(kept));
      return;
    }
    // array/string , → length
    this.push(num(toArr(a).length));
  }

  private opQuestion() {
    const b = this.pop();
    const a = this.pop();
    // num ? num → power
    if (a.t === "num" && b.t === "num") {
      this.push(num(Math.pow(a.n ?? 0, b.n ?? 0)));
      return;
    }
    // sequence ? element → index of element
    if (a.t !== "num") {
      const items = toArr(a);
      const idx = items.findIndex((x) => valKey(x) === valKey(b));
      this.push(num(idx));
      return;
    }
    this.push(num(-1));
  }

  private opDecrOrUncons(left: boolean) {
    const a = this.pop();
    if (a.t === "num") {
      this.push(num((a.n ?? 0) + (left ? -1 : 1)));
      return;
    }
    // uncons: ( takes first element, ) takes last
    const items = toArr(a);
    if (items.length === 0) {
      this.push(a);
      this.push(arr([]));
      return;
    }
    if (left) {
      const head = items[0];
      const rest = items.slice(1);
      this.push(a.t === "str" ? str(arrToStr(rest)) : arr(rest));
      this.push(head);
    } else {
      const tail = items[items.length - 1];
      const rest = items.slice(0, -1);
      this.push(a.t === "str" ? str(arrToStr(rest)) : arr(rest));
      this.push(tail);
    }
  }

  private opDollar() {
    const a = this.pop();
    // num $ → copy nth element from top of stack
    if (a.t === "num") {
      const n = a.n ?? 0;
      const idx = this.stack.length - 1 - n;
      if (idx >= 0 && idx < this.stack.length) {
        this.push(cloneVal(this.stack[idx]));
      }
      return;
    }
    // block: sort by key
    if (a.t === "block") {
      const seq = this.pop();
      const items = toArr(seq).slice();
      const keyed = items.map((item) => {
        this.push(item);
        this.execBlockVal(a);
        return { item, key: this.pop() };
      });
      keyed.sort((x, y) => compareVals(x.key, y.key));
      const sorted = keyed.map((k) => k.item);
      this.push(seq.t === "str" ? str(arrToStr(sorted)) : arr(sorted));
      return;
    }
    // array/string $ → sort
    const items = toArr(a).slice();
    items.sort(compareVals);
    this.push(a.t === "str" ? str(arrToStr(items)) : arr(items));
  }

  private opSetOp(op: string) {
    const b = this.pop();
    const a = this.pop();

    // Numeric bitwise operations.
    if (a.t === "num" && b.t === "num") {
      const x = a.n ?? 0;
      const y = b.n ?? 0;
      if (op === "|") this.push(num(x | y));
      else if (op === "&") this.push(num(x & y));
      else this.push(num(x ^ y));
      return;
    }

    const aArr = toArr(a);
    const bArr = toArr(b);
    const aKeys = new Set(aArr.map(valKey));
    const bKeys = new Set(bArr.map(valKey));
    let resultArr: GSVal[];

    if (op === "|") {
      // Union (preserve order, dedupe).
      const seen = new Set<string>();
      resultArr = [];
      for (const x of [...aArr, ...bArr]) {
        const k = valKey(x);
        if (!seen.has(k)) {
          seen.add(k);
          resultArr.push(x);
        }
      }
    } else if (op === "&") {
      // Intersection.
      const seen = new Set<string>();
      resultArr = [];
      for (const x of aArr) {
        const k = valKey(x);
        if (bKeys.has(k) && !seen.has(k)) {
          seen.add(k);
          resultArr.push(x);
        }
      }
    } else {
      // Symmetric difference.
      const seen = new Set<string>();
      resultArr = [];
      for (const x of aArr) {
        const k = valKey(x);
        if (!bKeys.has(k) && !seen.has(k)) {
          seen.add(k);
          resultArr.push(x);
        }
      }
      for (const x of bArr) {
        const k = valKey(x);
        if (!aKeys.has(k) && !seen.has(k)) {
          seen.add(k);
          resultArr.push(x);
        }
      }
    }

    const useStr = a.t === "str" || b.t === "str";
    this.push(useStr ? str(arrToStr(resultArr)) : arr(resultArr));
  }

  finalOutput(): string {
    const dump = this.stack.map(gsToDisplay).join("");
    return this.outBuffer + dump;
  }
}

// ----------------------------------------------------------------------
// Error type
// ----------------------------------------------------------------------
class GolfError extends Error {
  isTimeout: boolean;
  constructor(message: string, isTimeout: boolean) {
    super(message);
    this.name = "GolfError";
    this.isTimeout = isTimeout;
  }
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function cloneVal(v: GSVal): GSVal {
  switch (v.t) {
    case "num":
      return { t: "num", n: v.n };
    case "str":
      return { t: "str", s: v.s };
    case "arr":
      return { t: "arr", a: (v.a ?? []).map(cloneVal) };
    case "block":
      return { t: "block", b: v.b, src: v.src };
  }
}

function arrToStr(items: GSVal[]): string {
  return items
    .map((x) => {
      if (x.t === "num") return String.fromCharCode(x.n ?? 0);
      return gsToDisplay(x);
    })
    .join("");
}

function concatTwo(a: GSVal, b: GSVal): GSVal {
  const [ca, cb, target] = coercePair(a, b);
  if (target === "str") return str((ca.s ?? "") + (cb.s ?? ""));
  if (target === "arr") return arr([...(ca.a ?? []), ...(cb.a ?? [])]);
  const src = (ca.src ?? "") + " " + (cb.src ?? "");
  return block(tokenize(src), src.trim());
}

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function valKey(v: GSVal): string {
  switch (v.t) {
    case "num":
      return "n:" + v.n;
    case "str":
      return "s:" + v.s;
    case "arr":
      return "a:[" + (v.a ?? []).map(valKey).join(",") + "]";
    case "block":
      return "b:" + v.src;
  }
}

function compareVals(a: GSVal, b: GSVal): number {
  if (a.t === "num" && b.t === "num") {
    return (a.n ?? 0) - (b.n ?? 0);
  }
  if (a.t === "str" && b.t === "str") {
    const x = a.s ?? "";
    const y = b.s ?? "";
    return x < y ? -1 : x > y ? 1 : 0;
  }
  if (TYPE_ORDER[a.t] !== TYPE_ORDER[b.t]) {
    return TYPE_ORDER[a.t] - TYPE_ORDER[b.t];
  }
  // Array (or coerced) lexicographic comparison.
  const aArr = toArr(a);
  const bArr = toArr(b);
  const len = Math.min(aArr.length, bArr.length);
  for (let i = 0; i < len; i++) {
    const c = compareVals(aArr[i], bArr[i]);
    if (c !== 0) return c;
  }
  return aArr.length - bArr.length;
}

function splitString(s: string, sep: string): string[] {
  if (sep === "") return s.split("");
  return s.split(sep);
}

function splitArray(items: GSVal[], sep: GSVal[]): GSVal[][] {
  if (sep.length === 0) return items.map((x) => [x]);
  const result: GSVal[][] = [];
  let current: GSVal[] = [];
  let i = 0;
  while (i < items.length) {
    let match = true;
    for (let j = 0; j < sep.length; j++) {
      if (i + j >= items.length || valKey(items[i + j]) !== valKey(sep[j])) {
        match = false;
        break;
      }
    }
    if (match) {
      result.push(current);
      current = [];
      i += sep.length;
    } else {
      current.push(items[i]);
      i++;
    }
  }
  result.push(current);
  return result;
}

// ----------------------------------------------------------------------
// Public entry point
// ----------------------------------------------------------------------
export interface GolfRunOptions {
  timeoutMs?: number;
  maxSteps?: number;
}

/**
 * Executes a GolfScript program.
 *
 * The contents of `stdin` are pushed onto the stack as a string before
 * execution begins (mirroring GolfScript's behavior). When the program
 * finishes, the remaining stack is concatenated into the output, after
 * any text produced by explicit print/puts operators.
 */
export function runGolfScript(
  code: string,
  stdin: string,
  options: GolfRunOptions = {},
): RunResult {
  const timeoutMs = options.timeoutMs ?? 3000;
  const maxSteps = options.maxSteps ?? 5_000_000;

  const interp = new Interpreter(maxSteps, timeoutMs);
  // GolfScript seeds the stack with stdin as a string.
  interp.push(str(stdin));

  try {
    const tokens = tokenize(code);
    interp.run(tokens);
    return { stdout: interp.finalOutput(), error: null };
  } catch (err) {
    if (err instanceof GolfError) {
      return {
        stdout: interp.finalOutput(),
        error: err.isTimeout ? "TLE" : err.message,
      };
    }
    return {
      stdout: interp.finalOutput(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
