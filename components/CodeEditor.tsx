"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SubmitResponse, Verdict } from "@/lib/types";
import { useAuth } from "./AuthProvider";

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
  AC: { label: "정답", color: "#188038", bg: "#e6f4ea" },
  WA: { label: "오답", color: "#d93025", bg: "#fce8e6" },
  TLE: { label: "시간 초과", color: "#e37400", bg: "#fef7e0" },
  RE: { label: "런타임 에러", color: "#d93025", bg: "#fce8e6" },
  CE: { label: "컴파일 에러", color: "#d93025", bg: "#fce8e6" },
  PENDING: { label: "대기 중", color: "#5f6368", bg: "#f1f3f4" },
};

export default function CodeEditor({ problemId, onAccepted }: CodeEditorProps) {
  const { user, loading } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      if (res.ok && data.verdict === "AC") onAccepted?.();
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
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={"# 여기에 GolfScript 코드를 입력하세요\n~"}
          className="golf-editor h-72 w-full resize-none bg-surface px-4 py-3 text-sm text-ink outline-none"
        />
        <div className="flex items-center justify-between border-t border-surface-border bg-surface-dim px-4 py-2.5">
          <span className="font-mono text-xs text-ink-faint">
            {code.length}자
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-xs text-ink-faint">크기</span>
            <span className="font-mono text-lg font-bold text-primary tabular-nums">
              {bytes}
            </span>
            <span className="text-xs font-medium text-primary">바이트</span>
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
            <span className="font-medium text-ink-soft">{user.username}</span>{" "}
            님으로 제출
          </span>
        )}
        {errorMsg && <span className="text-sm text-danger">{errorMsg}</span>}
      </div>

      {result && meta && (
        <div
          className="animate-fade-in rounded-xl border p-4"
          style={{ borderColor: meta.color + "40", background: meta.bg }}
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
                <span className="font-mono font-semibold text-primary">
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
                    className="rounded-md border px-2 py-1 font-mono text-[11px]"
                    style={{
                      borderColor: cm.color + "40",
                      color: cm.color,
                      background: "#ffffff",
                    }}
                  >
                    {c.hidden ? "H" : "S"}
                    {c.index + 1} {c.verdict}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
