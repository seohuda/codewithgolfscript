"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Submission {
  id: string;
  problemId: number;
  problemTitle: string;
  code: string;
  bytes: number;
  verdict: string;
  created_at: string;
}

const VERDICT_META: Record<string, { label: string; color: string; bg: string }> =
  {
    AC: { label: "정답", color: "#188038", bg: "#e6f4ea" },
    WA: { label: "오답", color: "#d93025", bg: "#fce8e6" },
    TLE: { label: "시간 초과", color: "#e37400", bg: "#fef7e0" },
    RE: { label: "런타임 에러", color: "#d93025", bg: "#fce8e6" },
    CE: { label: "컴파일 에러", color: "#d93025", bg: "#fce8e6" },
    PENDING: { label: "대기", color: "#5f6368", bg: "#f1f3f4" },
  };

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function MySubmissionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [subs, setSubs] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/me/submissions?page=${page}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setSubs(data.submissions ?? []);
        setTotal(data.total ?? 0);
        setPageSize(data.pageSize ?? 20);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">내 제출</h1>
        <p className="mt-1 text-sm text-ink-soft">
          내가 제출한 코드와 채점 결과입니다. 본인만 볼 수 있습니다.
        </p>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          불러오는 중…
        </div>
      ) : subs.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          아직 제출한 코드가 없습니다.{" "}
          <Link href="/problems" className="text-primary hover:underline">
            문제 풀러 가기
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                <th className="px-4 py-3">문제</th>
                <th className="w-24 px-4 py-3">결과</th>
                <th className="w-20 px-4 py-3 text-right">바이트</th>
                <th className="hidden w-40 px-4 py-3 text-right sm:table-cell">
                  제출 시각
                </th>
                <th className="w-16 px-4 py-3 text-right">코드</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const meta = VERDICT_META[s.verdict] ?? VERDICT_META.PENDING;
                const isOpen = expanded === s.id;
                return (
                  <Fragment key={s.id}>
                    <tr
                      className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/problems/${s.problemId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {s.problemTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-md px-2 py-0.5 font-mono text-xs font-bold"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {s.verdict}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                        {s.bytes}
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-xs text-ink-faint sm:table-cell">
                        {formatTime(s.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setExpanded(isOpen ? null : s.id)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {isOpen ? "닫기" : "보기"}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${s.id}-code`} className="bg-surface-dim">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="overflow-x-auto rounded-lg border border-surface-border bg-surface p-3 font-mono text-sm text-ink">
                            {s.code}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > pageSize && (
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
