"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { getTierInfo, listTiers } from "@/lib/tiers";

export default function DifficultyVote({ problemId }: { problemId: number }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [avg, setAvg] = useState<number | null>(null);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(1);

  const tiers = listTiers().filter((t) => t.value >= 1);

  async function load() {
    try {
      const res = await fetch(`/api/problems/${problemId}/vote`, {
        cache: "no-store",
      });
      const d = await res.json();
      setCount(d.count ?? 0);
      setAvg(d.avg ?? null);
      setMyVote(d.myVote ?? null);
      if (d.myVote) setSel(d.myVote);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  async function vote() {
    const res = await fetch(`/api/problems/${problemId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: sel }),
    });
    if (res.ok) {
      setOpen(false);
      load();
    }
  }

  const avgInfo = avg ? getTierInfo(avg) : null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">체감 난이도</h2>
        {user && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-medium text-accent hover:underline"
          >
            {myVote ? "투표 수정" : "난이도 투표"}
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        {avgInfo ? (
          <>
            <span className="font-bold" style={{ color: avgInfo.color }}>
              {avgInfo.nameKo}
            </span>
            <span className="text-ink-faint">· {count}명 투표</span>
          </>
        ) : (
          <span className="text-ink-faint">아직 투표가 없습니다.</span>
        )}
      </div>
      {open && (
        <div className="mt-3 flex items-center gap-2">
          <select
            value={sel}
            onChange={(e) => setSel(Number(e.target.value))}
            className="field w-auto"
          >
            {tiers.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button onClick={vote} className="btn-filled px-3 py-1.5 text-xs">
            제출
          </button>
        </div>
      )}
    </div>
  );
}
