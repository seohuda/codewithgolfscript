"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token) {
        setStatus("fail");
        setMessage("토큰이 없습니다.");
        return;
      }
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const d = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setStatus("ok");
        } else {
          setStatus("fail");
          setMessage(d.error ?? "인증에 실패했습니다.");
        }
      } catch {
        if (!cancelled) {
          setStatus("fail");
          setMessage("네트워크 오류가 발생했습니다.");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="card mt-6 p-8">
      {status === "loading" && (
        <p className="text-sm text-ink-soft">인증 처리 중…</p>
      )}
      {status === "ok" && (
        <>
          <p className="text-sm font-semibold text-success">
            이메일 인증이 완료되었습니다.
          </p>
          <Link href="/" className="btn-filled mt-6 inline-flex">
            홈으로
          </Link>
        </>
      )}
      {status === "fail" && (
        <>
          <p className="text-sm text-danger">{message}</p>
          <Link href="/" className="btn-outlined mt-6 inline-flex">
            홈으로
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-sm py-10 text-center">
      <h1 className="text-2xl font-bold text-ink">이메일 인증</h1>
      <Suspense
        fallback={
          <div className="card mt-6 p-8 text-sm text-ink-soft">
            불러오는 중…
          </div>
        }
      >
        <VerifyInner />
      </Suspense>
    </div>
  );
}
