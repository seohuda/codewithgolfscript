"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("유효하지 않은 링크입니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(d.error ?? "재설정에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm font-semibold text-success">
          비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          새 비밀번호
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6자 이상"
          className="field"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-sm font-medium text-ink">
          새 비밀번호 확인
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="비밀번호 재입력"
          className="field"
        />
      </div>
      {error && (
        <p className="bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <button type="submit" disabled={submitting} className="btn-filled w-full">
        {submitting ? "변경 중…" : "비밀번호 변경"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink">비밀번호 재설정</h1>
      </div>
      <Suspense
        fallback={
          <div className="card p-6 text-center text-sm text-ink-soft">
            불러오는 중…
          </div>
        }
      >
        <ResetForm />
      </Suspense>
      <p className="mt-4 text-center text-sm text-ink-soft">
        <Link href="/login" className="font-medium text-accent hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
