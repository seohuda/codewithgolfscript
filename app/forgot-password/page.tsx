"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink">비밀번호 찾기</h1>
      </div>

      {sent ? (
        <div className="card p-6 text-center">
          <p className="text-sm leading-relaxed text-ink-soft">
            입력하신 이메일이 등록되어 있다면 비밀번호 재설정 링크를
            보냈습니다. 메일함을 확인해 주세요.
          </p>
          <Link href="/login" className="btn-outlined mt-6 inline-flex">
            로그인으로
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              가입한 이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-filled w-full">
            {submitting ? "전송 중…" : "재설정 링크 받기"}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-ink-soft">
        <Link href="/login" className="font-medium text-accent hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
