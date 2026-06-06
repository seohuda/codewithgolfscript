"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function HeaderNav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-5 text-sm">
      <Link
        href="/"
        className="text-mist-soft transition-colors hover:text-mist"
      >
        문제
      </Link>

      {loading ? (
        <span className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />
      ) : user ? (
        <div className="flex items-center gap-4">
          <span className="hidden text-mist-soft sm:inline">
            <span className="aurora-text font-medium">{user.username}</span>
            <span className="text-mist-dim"> 님</span>
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-mist-soft transition-colors hover:border-white/20 hover:text-mist"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-mist-soft transition-colors hover:text-mist"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="relative inline-flex items-center overflow-hidden rounded-lg border border-aurora-indigo/40 px-3 py-1.5 text-mist transition-colors hover:text-white"
          >
            <span className="absolute inset-0 -z-10 bg-aurora-gradient opacity-0 transition-opacity duration-300 hover:opacity-100" />
            회원가입
          </Link>
        </div>
      )}
    </nav>
  );
}
