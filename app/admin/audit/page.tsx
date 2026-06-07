"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface AuditEntry {
  id: number;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  view_user_submissions: "유저 제출 코드 열람",
  delete_report_target: "신고 콘텐츠 삭제",
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminAuditPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [fetching, setFetching] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) setDenied(true);
  }, [loading, user]);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${page}`, {
        cache: "no-store",
      });
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      const data = await res.json();
      setRows(data.entries ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 50);
    } finally {
      setFetching(false);
    }
  }, [page]);

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
        <h1 className="text-2xl font-bold text-ink">관리자 · 모니터링 기록</h1>
        <Link href="/admin/users" className="btn-outlined">
          유저 관리
        </Link>
      </div>

      <p className="text-sm text-ink-faint">
        관리자의 민감한 활동(유저 제출 코드 열람, 신고 콘텐츠 삭제 등)이 기록됩니다.
      </p>

      {fetching ? (
        <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          기록이 없습니다.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                <th className="hidden w-44 px-4 py-3 sm:table-cell">시각</th>
                <th className="w-28 px-4 py-3">관리자</th>
                <th className="w-44 px-4 py-3">활동</th>
                <th className="px-4 py-3">상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
                >
                  <td className="hidden px-4 py-3 font-mono text-xs text-ink-faint sm:table-cell">
                    {formatTime(r.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {r.adminName}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {ACTION_LABEL[r.action] ?? r.action}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-faint">
                    {r.detail || "-"}
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
