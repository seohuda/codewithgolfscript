"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AdminEmailTestPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [denied, setDenied] = useState(false);
  const [config, setConfig] = useState<unknown>(null);
  const [to, setTo] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) setDenied(true);
  }, [loading, user]);

  useEffect(() => {
    if (!loading && user?.isAdmin) {
      fetch("/api/admin/email-test", { cache: "no-store" })
        .then((r) => {
          if (r.status === 403) {
            setDenied(true);
            return null;
          }
          return r.json();
        })
        .then((d) => d && setConfig(d.config))
        .catch(() => {});
    }
  }, [loading, user]);

  async function sendTest() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim() }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>
    );
  }
  if (denied) {
    return (
      <div className="space-y-4">
        <div className="card p-10 text-center text-sm text-ink-soft">
          관리자만 접근할 수 있습니다.
        </div>
        <button onClick={() => router.push("/")} className="btn-outlined">
          홈으로
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold text-ink">관리자 · 메일 진단</h1>
        <Link href="/admin" className="btn-outlined">
          문제 관리
        </Link>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-bold text-ink">환경변수 상태</h2>
        <pre className="overflow-x-auto rounded border border-surface-border bg-surface-dim p-3 font-mono text-xs text-ink-soft">
          {config ? JSON.stringify(config, null, 2) : "불러오는 중…"}
        </pre>
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="text-sm font-bold text-ink">테스트 발송</h2>
        <p className="text-xs text-ink-faint">
          본인 이메일을 입력하고 발송 → 응답(status/response)으로 실패 원인을 확인합니다.
        </p>
        <div className="flex gap-2">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="you@example.com"
            className="field flex-1"
          />
          <button
            onClick={sendTest}
            disabled={sending || !to.trim()}
            className="btn-filled px-4"
          >
            {sending ? "발송 중…" : "테스트 발송"}
          </button>
        </div>
        {result != null && (
          <pre className="overflow-x-auto rounded border border-surface-border bg-surface-dim p-3 font-mono text-xs text-ink-soft">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
