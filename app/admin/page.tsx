"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Row {
  id: number;
  title: string;
  tier: number;
  step_group: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      setDenied(true);
    }
  }, [loading, user]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/problems", { cache: "no-store" });
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      const data = await res.json();
      setRows(data.problems ?? []);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user?.isAdmin) load();
  }, [loading, user, load]);

  async function handleDelete(id: number, title: string) {
    if (!confirm(`"${title}" 문제를 삭제하시겠습니까? 제출 기록도 함께 삭제됩니다.`))
      return;
    const res = await fetch(`/api/admin/problems/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const d = await res.json();
      alert(d.error ?? "삭제 실패");
    }
  }

  if (loading) {
    return <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>;
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
        <h1 className="text-2xl font-bold text-ink">관리자 · 문제 관리</h1>
        <div className="flex gap-2">
          <Link href="/admin/steps" className="btn-outlined">
            단계 관리
          </Link>
          <Link href="/admin/reports" className="btn-outlined">
            신고 관리
          </Link>
          <Link href="/admin/problems/new" className="btn-filled">
            새 문제
          </Link>
        </div>
      </div>

      {fetching ? (
        <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          문제가 없습니다.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                <th className="w-16 px-4 py-3">ID</th>
                <th className="w-16 px-4 py-3">티어</th>
                <th className="px-4 py-3">제목</th>
                <th className="hidden px-4 py-3 md:table-cell">단계</th>
                <th className="w-32 px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-variant"
                >
                  <td className="px-4 py-3 font-mono text-ink-faint">{r.id}</td>
                  <td className="px-4 py-3 font-mono text-ink-soft">{r.tier}</td>
                  <td className="px-4 py-3 font-medium text-ink">{r.title}</td>
                  <td className="hidden px-4 py-3 text-xs text-ink-faint md:table-cell">
                    {r.step_group || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/problems/${r.id}`}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(r.id, r.title)}
                        className="text-xs font-medium text-danger hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
