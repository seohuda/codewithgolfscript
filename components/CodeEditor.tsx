"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { SubmitResponse, Verdict } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { clearSolvedCache } from "./useSolved";

interface CodeEditorProps {
  problemId: number;
  onAccepted?: () => void;
}

function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

const VERDICT_META: Record<
  Verdict,
  { label: string; color: string; bg: string }
> = {
  AC: { label: "정답", color: "rgb(var(--success))", bg: "rgb(var(--success) / 0.14)" },
  WA: { label: "오답", color: "rgb(var(--danger))", bg: "rgb(var(--danger) / 0.14)" },
  TLE: { label: "시간 초과", color: "rgb(var(--warning))", bg: "rgb(var(--warning) / 0.14)" },
  RE: { label: "런타임 에러", color: "rgb(var(--danger))", bg: "rgb(var(--danger) / 0.14)" },
  CE: { label: "컴파일 에러", color: "rgb(var(--danger))", bg: "rgb(var(--danger) / 0.14)" },
  PENDING: { label: "대기 중", color: "rgb(var(--ink-soft))", bg: "rgb(var(--surface-variant))" },
};

export default function CodeEditor({ problemId, onAccepted }: CodeEditorProps) {
  const { user, loading } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = useMemo(() => code.split("\n").length, [code]);

  const bytes = useMemo(() => utf8Bytes(code), [code]);

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
        clearSolvedCache();
        onAccepted?.();
      }
      if (!res.ok && data.message) setErrorMsg(data.message);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      setCode(code.slice(0, start) + "  " + code.slice(end));
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!submitting) handleSubmit();
    }
  }

  const meta = result ? VERDICT_META[result.verdict] : null;

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-border bg-surface-dim px-4 py-2.5">
          <span className="font-mono text-xs text-ink-soft">main.gs</span>
          <span className="text-xs font-medium text-ink-faint">GolfScript</span>
        </div>
        <div className="flex">
          <div
            ref={gutterRef}
            aria-hidden
            className="golf-editor max-h-72 min-h-72 select-none overflow-hidden border-r border-surface-border bg-surface-dim px-2 py-3 text-right text-sm text-ink-faint"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={taRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={(e) => {
              if (gutterRef.current)
                gutterRef.current.scrollTop = e.currentTarget.scrollTop;
            }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={"# 여기에 GolfScript 코드를 입력하세요\n~"}
            className="golf-editor h-72 w-full resize-none bg-surface px-4 py-3 text-sm text-ink outline-none"
          />
        </div>
        <div className="flex items-center justify-between border-t border-surface-border bg-surface-dim px-4 py-2.5">
          <span className="font-mono text-xs text-ink-faint">
            {code.length}자
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-xs text-ink-faint">크기</span>
            <span className="font-mono text-lg font-bold text-accent tabular-nums">
              {bytes}
            </span>
            <span className="text-xs font-medium text-accent">바이트</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-filled"
          >
            {submitting ? "채점 중…" : "제출"}
          </button>
        ) : (
          <Link href="/login" className="btn-filled">
            로그인하고 제출
          </Link>
        )}
        {user && (
          <span className="text-sm text-ink-faint">
            <Link
              href={`/users/${encodeURIComponent(user.username)}`}
              className="font-medium text-ink-soft hover:text-accent hover:underline"
            >
              {user.username}
            </Link>{" "}
            님으로 제출
          </span>
        )}
        {errorMsg && <span className="text-sm text-danger">{errorMsg}</span>}
      </div>

      {result && meta && (
        <div
          className="animate-fade-in rounded-xl border border-surface-border p-4"
          style={{ background: meta.bg }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-base font-bold"
                style={{ color: meta.color }}
              >
                {result.verdict}
              </span>
              <span className="text-sm text-ink-soft">{meta.label}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-soft">
              <span>
                <span className="font-semibold text-ink">{result.passed}</span>/
                {result.total} 케이스
              </span>
              <span>
                <span className="font-mono font-semibold text-accent">
                  {result.bytes}
                </span>{" "}
                바이트
              </span>
            </div>
          </div>
          {result.results.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.results.map((c) => {
                const cm = VERDICT_META[c.verdict];
                return (
                  <span
                    key={c.index}
                    title={`${c.hidden ? "히든" : "공개"} 케이스 #${c.index + 1}: ${cm.label}`}
                    className="rounded-md border border-surface-border bg-surface px-2 py-1 font-mono text-[11px]"
                    style={{ color: cm.color }}
                  >
                    {c.hidden ? "H" : "S"}
                    {c.index + 1} {c.verdict}
                  </span>
                );
              })}
            </div>
          )}
          {result.subtaskResults && result.subtaskResults.length > 0 && (
            <div className="mt-3 border-t border-surface-border/60 pt-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-bold text-ink">부분 점수</span>
                <span className="font-mono font-bold text-accent">
                  {result.score} / {result.maxScore}점
                </span>
              </div>
              <div className="space-y-1">
                {result.subtaskResults.map((s) => (
                  <div
                    key={s.no}
                    className="flex items-center justify-between rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs"
                  >
                    <span className="text-ink-soft">
                      <span
                        className="mr-2 font-mono font-bold"
                        style={{ color: s.passed ? "#188038" : "#d93025" }}
                      >
                        {s.passed ? "✓" : "✗"}
                      </span>
                      서브태스크 {s.no}
                      {s.desc ? ` · ${s.desc}` : ""}
                    </span>
                    <span
                      className="font-mono font-semibold"
                      style={{ color: s.passed ? "#188038" : "#9aa0a6" }}
                    >
                      {s.passed ? s.points : 0} / {s.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.verdict === "AC" && (
            <div className="mt-3 border-t border-surface-border/60 pt-3 text-sm">
              {result.isRecord ? (
                <span className="font-semibold text-success">
                  🎉 최단 기록 달성! 현재 1위 {result.bytes}바이트입니다.
                </span>
              ) : (
                <span className="text-ink-soft">
                  내 코드{" "}
                  <span className="font-mono font-semibold text-ink">
                    {result.bytes}
                  </span>
                  바이트 · 현재 최단{" "}
                  <span className="font-mono font-semibold text-accent">
                    {result.bestBytes}
                  </span>
                  바이트
                  {result.bestBytes != null &&
                    result.bytes > result.bestBytes && (
                      <span className="text-ink-faint">
                        {" "}
                        ({result.bytes - result.bestBytes}바이트 더 줄이면
                        1위!)
                      </span>
                    )}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
