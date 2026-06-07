"use client";

import Link from "next/link";
import TierBadge from "@/components/TierBadge";
import { useSolved } from "@/components/useSolved";
import { useAuth } from "@/components/AuthProvider";

interface ChipProblem {
  id: number;
  title: string;
  tier: number;
}

export default function StepProblemList({
  problems,
}: {
  problems: ChipProblem[];
}) {
  const { user } = useAuth();
  const { solved, tried } = useSolved();

  return (
    <ul className="flex flex-wrap gap-2 p-4">
      {problems.map((p, i) => {
        const isSolved = user && solved.has(p.id);
        const isTried = user && !isSolved && tried.has(p.id);
        return (
          <li key={p.id}>
            <Link
              href={`/problems/${p.id}`}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-primary-container/30 ${
                isSolved
                  ? "border-success/40 bg-success/10"
                  : isTried
                    ? "border-danger/40 bg-danger/5"
                    : "border-surface-border bg-surface"
              }`}
            >
              <span className="font-mono text-xs text-ink-faint">{i + 1}</span>
              <TierBadge tier={p.tier} size="sm" />
              <span className="font-medium text-ink">{p.title}</span>
              {isSolved && (
                <span className="text-success" title="맞은 문제">
                  ✓
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
