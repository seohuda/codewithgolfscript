"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SubmitResponse, Verdict } from "@/lib/types";
import { useAuth } from "./AuthProvider";

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
    label: "정답",
    className: "text-aurora-cyan",
    ring: "ring-aurora-cyan/40",
  },
  WA: {
    label: "오답",
    className: "text-rose-400",
    ring: "ring-rose-400/40",
  },
  TLE: {
    label: "시간 초과",
    className: "text-amber-400",
    ring: "ring-amber-400/40",
  },
  RE: {
    label: "런타임 에러",
    className: "text-orange-400",
    ring: "ring-orange-400/40",
  },
  CE: {
    label: "컴파일 에러",
    className: "text-orange-400",
    ring: "ring-orange-400/40",
  },
  PENDING: {
    label: "대기 중",
    className: "text-mist-soft",
    ring: "ring-white/10",
  },
};

export default function CodeEditor({ problemId, onAccepted }: CodeEditorProps) {
  const { user, loading } = useAuth();
  const [code, setCode] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bytes = useMemo(() => utf8Bytes(code), [code]);
  const chars = code.length;

  async function handleSubmit() {
    setErrorMsg(null);
    setResult(null);

    if (!user) {
      setErrorMsg("제출하려면 로그인이 필요합니다.");
      return;
    }
    if (!code) {
      setErrorMsg("GolfScript 코드를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, code }),
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
        e instanceof Error ? e.message : "제출에 실패했습니다. 다시 시도해 주세요.",
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
      {/* Login status row */}
      <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-abyss-900/40 px-4 py-2.5">
        <span className="text-xs uppercase tracking-[0.2em] text-mist-dim">
          제출자
        </span>
        {loading ? (
          <span className="h-4 w-20 animate-pulse rounded bg-white/[0.06]" />
        ) : user ? (
          <span className="font-mono text-sm">
            <span className="aurora-text font-medium">{user.username}</span>
          </span>
        ) : (
          <span className="text-sm text-mist-soft">
            <Link href="/login" className="aurora-text font-medium hover:underline">
              로그인
            </Link>{" "}
            후 제출할 수 있습니다
          </span>
        )}
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
          placeholder={`# 여기에 GolfScript 코드를 입력하세요\n~`}
          className="golf-editor h-[360px] w-full resize-none bg-transparent px-5 py-4 text-sm text-mist outline-none"
        />

        {/* Byte counter — glows softly in neon. */}
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-abyss-900/40 px-5 py-3">
          <span className="font-mono text-[11px] text-mist-dim">
            {chars}자
          </span>
          <span className="relative flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-dim">
              크기
            </span>
            <span className="relative inline-flex items-center">
              <span className="absolute inset-0 -z-10 animate-aurora-pulse rounded-md bg-aurora-gradient opacity-30 blur-md" />
              <span className="aurora-text font-mono text-lg font-semibold tabular-nums">
                {bytes}
              </span>
              <span className="ml-1 font-mono text-xs text-aurora-glow">
                바이트
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
          disabled={submitting || loading || !user}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border border-aurora-indigo/40 bg-abyss-800 px-5 py-2.5 text-sm font-medium text-mist transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="absolute inset-0 -z-10 bg-aurora-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-disabled:opacity-0" />
          {submitting ? "채점 중…" : !user ? "로그인 필요" : "제출"}
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
                {result.total} 케이스
              </span>
              <span>
                <span className="aurora-text font-mono font-semibold">
                  {result.bytes}
                </span>{" "}
                바이트
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
                    title={`${c.hidden ? "히든" : "공개"} 케이스 #${
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
