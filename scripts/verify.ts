import { runGolfScript } from "../lib/golfscript";
import P from "./problems.data";

let total = 0;
let failed = 0;
const failures: string[] = [];

for (const prob of P) {
  for (const c of prob.cases) {
    total++;
    const r = runGolfScript(prob.solution, c.stdin, {
      timeoutMs: 3000,
      maxSteps: 5_000_000,
    });
    const got = r.stdout.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    const exp = c.stdout.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (r.error || got !== exp) {
      failed++;
      failures.push(
        `[${prob.title}] code=${JSON.stringify(prob.solution)} stdin=${JSON.stringify(
          c.stdin,
        )} got=${JSON.stringify(got)} exp=${JSON.stringify(exp)} err=${r.error}`,
      );
    }
  }
}

console.log(`\nProblems: ${P.length}`);
console.log(`Cases: ${total}, Failed: ${failed}`);
if (failures.length) {
  console.log("\n--- FAILURES ---");
  for (const f of failures) console.log(f);
  process.exit(1);
} else {
  console.log("ALL PASS");
}
