"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { LeaderboardRow } from "@/lib/types";
import UserName from "./UserName";

interface LeaderboardProps {
  problemId: number;
  refreshKey?: number;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function rankColor(rank: number): string {
  if (rank === 1) return "#e37400";
  if (rank === 2) return "#5f6368";
  if (rank === 3) return "#ad5600";
  return "#80868b";
}

export default function Leaderboard({
  problemId,
  refreshKey = 0,
}: LeaderboardProps) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [tierMap, setTierMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: qErr } = await supabase
          .from("leaderboard")
          .select("problem_id, user_id, username, bytes, created_at, rank")
          .eq("problem_id", problemId)
          .order("bytes", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(100);
        if (cancelled) return;
        if (qErr) {
          setError(qErr.message);
          setRows([]);
        } else {
          setRows((data ?? []) as LeaderboardRow[]);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "불러오기 실패");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [problemId, refreshKey]);

  // Fetch user tiers (for colored usernames).
  useEffect(() => {
    let cancelled = false;
    async function loadTiers() {
      try {
        const res = await fetch("/api/ranking", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        const map: Record<string, number> = {};
        for (const e of data.ranking ?? []) map[e.username] = e.tier;
        setTierMap(map);
      } catch {
        /* ignore */
      }
    }
    loadTiers();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="card mt-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-surface-border bg-surface-dim px-4 py-3">
        <h3 className="text-sm font-bold text-ink">랭킹</h3>
        <span className="text-xs text-ink-faint">바이트 ↑ · 시간 ↑</span>
      </div>
      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-ink-faint">
          불러오는 중…
        </div>
      ) : error ? (
        <div className="px-4 py-8 text-center text-sm text-ink-soft">
          랭킹을 불러오지 못했습니다.
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-ink-faint">
          아직 정답이 없습니다. 첫 번째로 풀어 보세요!
        </div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs font-semibold text-ink-soft">
              <th className="w-16 px-4 py-2.5">순위</th>
              <th className="px-4 py-2.5">유저</th>
              <th className="px-4 py-2.5 text-right">바이트</th>
              <th className="px-4 py-2.5 text-right">시각</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.user_id}-${row.created_at}`}
                className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
              >
                <td className="px-4 py-2.5">
                  <span
                    className="font-mono font-bold"
                    style={{ color: rankColor(row.rank) }}
                  >
                    {row.rank}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <UserName
                    username={row.username}
                    tier={tierMap[row.username] ?? 0}
                  />
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-accent">
                  {row.bytes}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-ink-faint">
                  {formatTime(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
