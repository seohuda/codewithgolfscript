"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { LeaderboardRow } from "@/lib/types";

interface LeaderboardProps {
  problemId: number;
  /** Bumping this value triggers a refetch (e.g. after a new AC). */
  refreshKey?: number;
}

function formatBytes(bytes: number): string {
  return `${bytes} B`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function rankBadge(rank: number): string {
  if (rank === 1) return "text-aurora-cyan";
  if (rank === 2) return "text-aurora-glow";
  if (rank === 3) return "text-aurora-violet";
  return "text-mist-dim";
}

export default function Leaderboard({
  problemId,
  refreshKey = 0,
}: LeaderboardProps) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
          setError(e instanceof Error ? e.message : "Failed to load leaderboard.");
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

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <h3 className="text-sm font-medium tracking-wide text-mist">
          Leaderboard
        </h3>
        <span className="text-[10px] uppercase tracking-[0.2em] text-mist-dim">
          Bytes &uarr; · Time &uarr;
        </span>
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm text-mist-dim">
          Loading rankings&hellip;
        </div>
      ) : error ? (
        <div className="px-5 py-10 text-center text-sm text-mist-soft">
          Unable to load leaderboard.
          <span className="mt-1 block text-xs text-mist-dim">{error}</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-mist-dim">
          No accepted solutions yet. Be the first to land an{" "}
          <span className="font-mono text-aurora-cyan">AC</span>.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-mist-dim">
                <th className="border-b border-white/[0.06] px-5 py-3 font-medium">
                  #
                </th>
                <th className="border-b border-white/[0.06] px-5 py-3 font-medium">
                  User
                </th>
                <th className="border-b border-white/[0.06] px-5 py-3 text-right font-medium">
                  Bytes
                </th>
                <th className="border-b border-white/[0.06] px-5 py-3 text-right font-medium">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.user_id}-${row.created_at}`}
                  className="group transition-colors hover:bg-white/[0.03]"
                >
                  <td className="border-b border-white/[0.04] px-5 py-3">
                    <span
                      className={`font-mono text-sm font-semibold ${rankBadge(
                        row.rank,
                      )}`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="border-b border-white/[0.04] px-5 py-3">
                    <span className="text-mist transition-colors group-hover:text-white">
                      {row.username}
                    </span>
                  </td>
                  <td className="border-b border-white/[0.04] px-5 py-3 text-right">
                    <span className="font-mono text-aurora-glow">
                      {formatBytes(row.bytes)}
                    </span>
                  </td>
                  <td className="border-b border-white/[0.04] px-5 py-3 text-right">
                    <span className="font-mono text-xs text-mist-dim">
                      {formatTime(row.created_at)}
                    </span>
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
