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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  // Username availability (signup only).
  const [agreed, setAgreed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "ok" | "taken"
  >("idle");
  const [usernameMsg, setUsernameMsg] = useState<string | null>(null);

  const isSignup = mode === "signup";
  const title = isSignup ? "회원가입" : "로그인";
  const cta = isSignup ? "계정 만들기" : "로그인";

  function onUsernameChange(v: string) {
    setUsername(v);
    // Any edit invalidates a previous availability check.
    if (usernameStatus !== "idle") setUsernameStatus("idle");
    if (usernameMsg) setUsernameMsg(null);
  }

  async function handleCheckUsername() {
    setUsernameMsg(null);
    const name = username.trim();
    if (name.length < 3) {
      setUsernameStatus("taken");
      setUsernameMsg("아이디는 3자 이상이어야 합니다.");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(
        `/api/auth/check-username?username=${encodeURIComponent(name)}`,
        { cache: "no-store" },
      );
      const d = (await res.json()) as { available: boolean; error?: string };
      if (d.available) {
        setUsernameStatus("ok");
        setUsernameMsg("사용 가능한 아이디입니다.");
      } else {
        setUsernameStatus("taken");
        setUsernameMsg(d.error ?? "사용할 수 없는 아이디입니다.");
      }
    } catch {
      setUsernameStatus("idle");
      setUsernameMsg("확인 중 오류가 발생했습니다.");
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const d = await res.json();
      setNotice(d.message ?? "인증 메일을 다시 보냈습니다.");
      setShowResend(false);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setShowResend(false);
    if (isSignup && password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (isSignup && !agreed) {
      setError("이용약관 및 개인정보처리방침에 동의해 주세요.");
      return;
    }
    if (isSignup && usernameStatus !== "ok") {
      setError("아이디 중복 확인을 먼저 해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignup
        ? { username: username.trim(), email: email.trim(), password }
        : { username: username.trim(), password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        user?: AuthUser;
        error?: string;
        verificationRequired?: boolean;
        emailSent?: boolean;
      };

      if (isSignup) {
        // Signup no longer logs the user in; it requires email verification.
        if (!res.ok) {
          setError(data.error ?? "요청을 처리하지 못했습니다.");
          return;
        }
        if (data.emailSent === false) {
          setNotice(
            "가입은 되었지만 인증 메일 발송에 실패했습니다. 잠시 후 로그인 화면에서 '인증 메일 다시 보내기'를 눌러 주세요.",
          );
        } else {
          setNotice(
            "가입이 거의 완료되었습니다! 보내드린 인증 메일의 링크를 눌러 이메일 인증을 마치면 로그인할 수 있습니다. (스팸함도 확인해 주세요)",
          );
        }
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirm("");
        setUsernameStatus("idle");
        setUsernameMsg(null);
        return;
      }

      if (!res.ok || !data.user) {
        setError(data.error ?? "요청을 처리하지 못했습니다.");
        if (data.verificationRequired) setShowResend(true);
        return;
      }
      setUser(data.user);
      router.push("/problems");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm animate-fade-in py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {isSignup
            ? "계정을 만들고 가장 짧은 코드에 도전하세요."
            : "다시 오신 것을 환영합니다."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-medium text-ink">
            아이디
          </label>
          {isSignup ? (
            <>
              <div className="flex gap-2">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  autoComplete="username"
                  placeholder="영문, 숫자, 밑줄(_) 3~20자"
                  className="field font-mono flex-1"
                />
                <button
                  type="button"
                  onClick={handleCheckUsername}
                  disabled={checking || username.trim().length < 3}
                  className="btn-outlined whitespace-nowrap px-3 text-sm"
                >
                  {checking ? "확인 중…" : "중복 확인"}
                </button>
              </div>
              {usernameMsg && (
                <p
                  className={`text-xs ${
                    usernameStatus === "ok" ? "text-success" : "text-danger"
                  }`}
                >
                  {usernameMsg}
                </p>
              )}
            </>
          ) : (
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="아이디"
              className="field font-mono"
            />
          )}
        </div>
        {isSignup && (
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="field"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="6자 이상"
            className="field font-mono"
          />
        </div>
        {isSignup && (
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-sm font-medium text-ink">
              비밀번호 확인
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="비밀번호 재입력"
              className="field font-mono"
            />
          </div>
        )}
        {isSignup && (
          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-accent"
            />
            <span>
              <Link href="/terms" className="text-accent hover:underline" target="_blank">이용약관</Link>
              {" 및 "}
              <Link href="/privacy" className="text-accent hover:underline" target="_blank">개인정보처리방침</Link>
              에 동의합니다. (만 14세 이상)
            </span>
          </label>
        )}
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        {showResend && (
          <button
            type="button"
            onClick={handleResend}
            className="btn-outlined w-full text-sm"
          >
            인증 메일 다시 보내기
          </button>
        )}
        {notice && (
          <p className="bg-success/10 px-3 py-2 text-sm text-success">
            {notice}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn-filled w-full"
        >
          {submitting ? "처리 중…" : cta}
        </button>
        {!isSignup && (
          <p className="text-center text-xs">
            <Link
              href="/forgot-password"
              className="text-ink-faint hover:text-accent hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </p>
        )}
      </form>

      <p className="mt-4 text-center text-sm text-ink-soft">
        {isSignup ? (
          <>
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              로그인
            </Link>
          </>
        ) : (
          <>
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">
              회원가입
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
