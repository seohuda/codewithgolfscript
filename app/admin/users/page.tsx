"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface UserRow {
  id: string;
  username: string;
  email: string | null;
  isAdmin: boolean;
  banned: boolean;
  bannedUntil: string | null;
  createdAt: string;
  totalSubmissions: number;
  acSubmissions: number;
  lastSubmission: string | null;
}

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [fetching, setFetching] = useState(true);
  const [denied, setDenied] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) setDenied(true);
  }, [loading, user]);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      const data = await res.json();
      setRows(data.users ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 30);
    } finally {
      setFetching(false);
    }
  }, [page, query]);

  useEffect(() => {
    if (!loading && user?.isAdmin) load();
  }, [loading, user, load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
        <h1 className="text-2xl font-bold text-ink">관리자 · 유저 관리</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn-outlined">
            문제 관리
          </Link>
          <Link href="/admin/audit" className="btn-outlined">
            모니터링 기록
          </Link>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(searchInput.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="아이디 검색"
          className="field flex-1"
        />
        <button type="submit" className="btn-filled px-4">
          검색
        </button>
      </form>

      {fetching ? (
        <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          유저가 없습니다.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                <th className="px-4 py-3">아이디</th>
                <th className="hidden px-4 py-3 md:table-cell">이메일</th>
                <th className="w-20 px-4 py-3 text-right">제출</th>
                <th className="w-16 px-4 py-3 text-right">정답</th>
                <th className="hidden w-32 px-4 py-3 text-right sm:table-cell">
                  최근 제출
                </th>
                <th className="w-16 px-4 py-3 text-right">코드</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">{u.username}</span>
                    {u.isAdmin && (
                      <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-bold text-accent">
                        관리자
                      </span>
                    )}
                    {u.banned && (
                      <span className="ml-2 rounded bg-danger/15 px-1.5 py-0.5 text-[11px] font-bold text-danger">
                        정지
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-ink-faint md:table-cell">
                    {u.email ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink-soft">
                    {u.totalSubmissions}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink-soft">
                    {u.acSubmissions}
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono text-xs text-ink-faint sm:table-cell">
                    {formatTime(u.lastSubmission)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!fetching && total > pageSize && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-variant disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-sm text-ink-soft">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-variant disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
