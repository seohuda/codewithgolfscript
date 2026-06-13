"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-surface px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          본 사이트는 로그인 세션 유지를 위해 필수 쿠키를 사용합니다.{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            개인정보처리방침
          </Link>
        </p>
        <button onClick={accept} className="btn-filled text-sm px-4 py-1.5">
          확인
        </button>
      </div>
    </div>
  );
}
