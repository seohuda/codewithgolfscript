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

  if (loading) {
    return <span className="h-8 w-20 animate-pulse rounded-md bg-surface-variant" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link
          href={`/users/${encodeURIComponent(user.username)}`}
          className="hidden text-ink-soft hover:text-primary sm:inline"
        >
          <span className="font-semibold text-ink">{user.username}</span> 님
        </Link>
        <button type="button" onClick={handleLogout} className="btn-text">
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link href="/login" className="btn-text">
        로그인
      </Link>
      <Link href="/signup" className="btn-filled px-4 py-1.5">
        회원가입
      </Link>
    </div>
  );
}
