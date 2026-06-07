"use client";

import { useEffect, useState } from "react";
import UserName from "@/components/UserName";
import TierBadge from "@/components/TierBadge";

interface RankingEntry {
  username: string;
  score: number;
  tier: number;
  solvedCount: number;
}

function rankColor(rank: number): string {
  if (rank === 1) return "#e37400";
  if (rank === 2) return "#5f6368";
  if (rank === 3) return "#ad5600";
  return "#80868b";
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ranking", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setRanking(data.ranking ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">랭킹</h1>
        <p className="mt-1 text-sm text-ink-soft">
          푼 문제의 난이도에 따라 점수가 매겨집니다. 관리자는 제외됩니다.
        </p>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          불러오는 중…
        </div>
      ) : ranking.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          아직 랭킹이 없습니다. 첫 번째로 문제를 풀어 보세요!
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                <th className="w-16 px-4 py-3">순위</th>
                <th className="w-28 px-4 py-3">티어</th>
                <th className="px-4 py-3">아이디</th>
                <th className="px-4 py-3 text-right">맞은 문제</th>
                <th className="px-4 py-3 text-right">점수</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((e, i) => (
                <tr
                  key={e.username}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
                >
                  <td className="px-4 py-3">
                    <span
                      className="font-mono font-bold"
                      style={{ color: rankColor(i + 1) }}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={e.tier} showName size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <UserName username={e.username} tier={e.tier} />
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {e.solvedCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-accent">
                    {e.score}
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
