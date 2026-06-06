"use client";

import { useMemo, useState } from "react";
import { SubmitResponse, Verdict } from "@/lib/types";

interface CodeEditorProps {
  problemId: number;
  onAccepted?: () => void;
}

/**
 * Computes the exact UTF-8 byte length in the browser using TextEncoder.
 * This mirrors the server-side ranking metric exactly.
 */
function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

const VERDICT_META: Record<
  Verdict,
  { label: string; className: string; ring: string }
> = {
  AC: {
    label: "Accepted",
    className: "text-aurora-cyan",
    ring: "ring-aurora-cyan/40",
  },
  WA: {
    label: "Wrong Answer",
    className: "text-rose-400",
    ring: "ring-rose-400/40",
  },
  TLE: {
    label: "Time Limit Exceeded",
    className: "text-amber-400",
    ring: "ring-amber-400/40",
  },
  RE: {
    label: "Runtime Error",
    className: "text-orange-400",
    ring: "ring-orange-400/40",
  },
  CE: {
    label: "Compile Error",
    className: "text-orange-400",
    ring: "ring-orange-400/40",
  },
  PENDING: {
    label: "Pending",
    className: "text-mist-soft",
    ring: "ring-white/10",
  },
};

export default function CodeEditor({ problemId, onAccepted }: CodeEditorProps) {
  const [code, setCode] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bytes = useMemo(() => utf8Bytes(code), [code]);
  const chars = code.length;

  async function handleSubmit() {
    setErrorMsg(null);
    setResult(null);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setErrorMsg("Enter a username before submitting.");
      return;
    }
    if (!code) {
      setErrorMsg("Write some GolfScript before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, username: trimmedUser, code }),
      });

      const data = (await res.json()) as SubmitResponse;
      setResult(data);

      if (res.ok && data.verdict === "AC") {
        onAccepted?.();
      }
      if (!res.ok && data.message) {
        setErrorMsg(data.message);
      }
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "Submission failed. Please retry.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Tab inserts two spaces instead of moving focus.
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const next = code.slice(0, start) + "  " + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
    // Ctrl/Cmd + Enter submits.
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!submitting) handleSubmit();
    }
  }

  const verdictMeta = result ? VERDICT_META[result.verdict] : null;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Username row */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="username"
          className="text-xs uppercase tracking-[0.2em] text-mist-dim"
        >
          Handle
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your_handle"
          maxLength={64}
          className="flex-1 rounded-lg border border-white/[0.08] bg-abyss-900/60 px-3 py-2 font-mono text-sm text-mist outline-none transition-colors placeholder:text-mist-dim/60 focus:border-aurora-indigo/50 focus:ring-1 focus:ring-aurora-indigo/30"
        />
      </div>

      {/* Editor */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-abyss-900/70 shadow-aurora">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-aurora-cyan/60" />
            <span className="ml-3 font-mono text-xs text-mist-dim">
              main.gs
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-mist-dim">
            GolfScript
          </span>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={`# Write your GolfScript here\n~`}
          className="golf-editor h-[360px] w-full resize-none bg-transparent px-5 py-4 text-sm text-mist outline-none"
        />

        {/* Byte counter — glows softly in neon. */}
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-abyss-900/40 px-5 py-3">
          <span className="font-mono text-[11px] text-mist-dim">
            {chars} chars
          </span>
          <span className="relative flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-dim">
              size
            </span>
            <span className="relative inline-flex items-center">
              <span className="absolute inset-0 -z-10 animate-aurora-pulse rounded-md bg-aurora-gradient opacity-30 blur-md" />
              <span className="aurora-text font-mono text-lg font-semibold tabular-nums">
                {bytes}
              </span>
              <span className="ml-1 font-mono text-xs text-aurora-glow">
                bytes
              </span>
            </span>
          </span>
        </div>
      </div>

      {/* Submit + status */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border border-aurora-indigo/40 bg-abyss-800 px-5 py-2.5 text-sm font-medium text-mist transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="absolute inset-0 -z-10 bg-aurora-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-disabled:opacity-0" />
          {submitting ? "Judging…" : "Submit"}
          <span className="font-mono text-[10px] text-mist-dim transition-colors group-hover:text-white/80">
            {"\u2318\u23ce"}
          </span>
        </button>

        {errorMsg && (
          <span className="text-sm text-rose-400">{errorMsg}</span>
        )}
      </div>

      {/* Result panel */}
      {result && verdictMeta && (
        <div
          className={`animate-fade-in rounded-xl border border-white/[0.06] bg-abyss-800/60 p-5 ring-1 ${verdictMeta.ring}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`font-mono text-base font-bold ${verdictMeta.className}`}
              >
                {result.verdict}
              </span>
              <span className="text-sm text-mist-soft">
                {verdictMeta.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-mist-dim">
              <span>
                <span className="text-mist">{result.passed}</span>/
                {result.total} cases
              </span>
              <span>
                <span className="aurora-text font-mono font-semibold">
                  {result.bytes}
                </span>{" "}
                bytes
              </span>
            </div>
          </div>

          {/* Per-case grid. Hidden cases are flagged but never reveal data. */}
          {result.results.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {result.results.map((c) => {
                const meta = VERDICT_META[c.verdict];
                return (
                  <div
                    key={c.index}
                    title={`${c.hidden ? "Hidden case" : "Sample case"} #${
                      c.index + 1
                    }: ${meta.label}`}
                    className={`flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-abyss-900/60 px-2.5 py-1.5 font-mono text-[11px] ${meta.className}`}
                  >
                    <span className="text-mist-dim">
                      {c.hidden ? "H" : "S"}
                      {c.index + 1}
                    </span>
                    <span>{c.verdict}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
