"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import TierBadge from "@/components/TierBadge";

interface ProblemStat {
  id: number;
  title: string;
  tier: number;
  solvers: number;
  attempts: number;
  acRate: number;
}

interface Stats {
  totals: {
    users: number;
    problems: number;
    submissions: number;
    posts: number;
    openReports: number;
    newUsers7d: number;
    submissions7d: number;
  };
  popular: ProblemStat[];
  hardest: ProblemStat[];
  unsolved: ProblemStat[];
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-ink-faint">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">
        {value.toLocaleString()}
      </div>
      {sub && <div className="mt-0.5 text-xs text-accent">{sub}</div>}
    </div>
  );
}

function ProblemTable({
  title,
  rows,
  metric,
}: {
  title: string;
  rows: ProblemStat[];
  metric: "solvers" | "acRate" | "attempts";
}) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-surface-border bg-surface-dim px-4 py-3 text-sm font-bold text-ink">
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-sm text-ink-faint">데이터 없음</div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
              >
                <td className="px-4 py-2.5">
                  <TierBadge tier={r.tier} size="sm" />
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/problems/${r.id}`}
                    className="font-medium text-ink hover:text-accent hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-ink-soft">
                  {metric === "solvers" && `${r.solvers}명`}
                  {metric === "acRate" && `${r.acRate}%`}
                  {metric === "attempts" && `${r.attempts}회 시도`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminStatsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) setDenied(true);
  }, [loading, user]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      const data = await res.json();
      setStats(data);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user?.isAdmin) load();
  }, [loading, user, load]);

  if (loading || fetching) {
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
  if (!stats) {
    return (
      <div className="card p-10 text-center text-sm text-ink-soft">
        통계를 불러오지 못했습니다.
      </div>
    );
  }

  const t = stats.totals;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold text-ink">관리자 · 통계</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn-outlined">
            문제 관리
          </Link>
          <Link href="/admin/reports" className="btn-outlined">
            신고 관리
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="가입자" value={t.users} sub={`+${t.newUsers7d} (7일)`} />
        <StatCard label="문제" value={t.problems} />
        <StatCard
          label="제출"
          value={t.submissions}
          sub={`+${t.submissions7d} (7일)`}
        />
        <StatCard label="게시글" value={t.posts} />
        <StatCard label="미처리 신고" value={t.openReports} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProblemTable title="인기 문제 (많이 푼 순)" rows={stats.popular} metric="solvers" />
        <ProblemTable
          title="어려운 문제 (정답률 낮은 순)"
          rows={stats.hardest}
          metric="acRate"
        />
      </div>

      <ProblemTable
        title="아무도 못 푼 문제 (시도는 있음)"
        rows={stats.unsolved}
        metric="attempts"
      />
    </div>
  );
}
