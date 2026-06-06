"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, AuthUser } from "./AuthProvider";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";
  const title = isSignup ? "회원가입" : "로그인";
  const cta = isSignup ? "계정 만들기" : "로그인";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isSignup && password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = (await res.json()) as {
        user?: AuthUser;
        error?: string;
      };

      if (!res.ok || !data.user) {
        setError(data.error ?? "요청을 처리하지 못했습니다.");
        return;
      }

      setUser(data.user);
      router.push("/");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-mist">
          {title}
        </h1>
        <p className="mt-2 text-sm text-mist-soft">
          {isSignup
            ? "계정을 만들고 가장 짧은 코드에 도전하세요."
            : "다시 오신 것을 환영합니다."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="panel space-y-5 p-7">
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="text-xs uppercase tracking-[0.2em] text-mist-dim"
          >
            아이디
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="영문, 숫자, 밑줄(_)"
            className="w-full rounded-lg border border-white/[0.08] bg-abyss-900/60 px-3 py-2.5 font-mono text-sm text-mist outline-none transition-colors placeholder:text-mist-dim/60 focus:border-aurora-indigo/50 focus:ring-1 focus:ring-aurora-indigo/30"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-xs uppercase tracking-[0.2em] text-mist-dim"
          >
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="6자 이상"
            className="w-full rounded-lg border border-white/[0.08] bg-abyss-900/60 px-3 py-2.5 font-mono text-sm text-mist outline-none transition-colors placeholder:text-mist-dim/60 focus:border-aurora-indigo/50 focus:ring-1 focus:ring-aurora-indigo/30"
          />
        </div>

        {isSignup && (
          <div className="space-y-2">
            <label
              htmlFor="confirm"
              className="text-xs uppercase tracking-[0.2em] text-mist-dim"
            >
              비밀번호 확인
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="비밀번호 재입력"
              className="w-full rounded-lg border border-white/[0.08] bg-abyss-900/60 px-3 py-2.5 font-mono text-sm text-mist outline-none transition-colors placeholder:text-mist-dim/60 focus:border-aurora-indigo/50 focus:ring-1 focus:ring-aurora-indigo/30"
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-lg border border-aurora-indigo/40 bg-abyss-800 px-5 py-2.5 text-sm font-medium text-mist transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="absolute inset-0 -z-10 bg-aurora-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-disabled:opacity-0" />
          {submitting ? "처리 중…" : cta}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-mist-soft">
        {isSignup ? (
          <>
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="aurora-text font-medium hover:underline"
            >
              로그인
            </Link>
          </>
        ) : (
          <>
            아직 계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="aurora-text font-medium hover:underline"
            >
              회원가입
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
