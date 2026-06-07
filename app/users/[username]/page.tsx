"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TierBadge from "@/components/TierBadge";

interface SolvedProblem {
  id: number;
  title: string;
  tier: number;
  bytes: number;
}

interface ProfileData {
  user: { username: string; created_at: string; is_admin: boolean };
  stats: {
    totalSubmissions: number;
    acSubmissions: number;
    solvedCount: number;
    acceptanceRate: number;
    totalBytes: number;
    verdictCounts: Record<string, number>;
  };
  solvedProblems: SolvedProblem[];
}

const VERDICT_LABEL: Record<string, string> = {
  AC: "정답",
  WA: "오답",
  TLE: "시간 초과",
  RE: "런타임 에러",
  CE: "컴파일 에러",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ProfilePage() {
  const params = useParams();
  const username = Array.isArray(params.username)
    ? params.username[0]
    : params.username;

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/users/${username}`, {
          cache: "no-store",
        });
        const d = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(d.error ?? "불러오기 실패");
        } else {
          setData(d as ProfileData);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="card p-10 text-center text-sm text-ink-faint">
        불러오는 중…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <div className="card p-10 text-center text-sm text-ink-soft">
          {error ?? "프로필을 찾을 수 없습니다."}
        </div>
        <Link href="/" className="btn-outlined">
          홈으로
        </Link>
      </div>
    );
  }

  const { user, stats, solvedProblems } = data;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header card */}
      <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">{user.username}</h1>
            {user.is_admin && (
              <span className="chip border-primary/30 bg-primary-container/50 text-primary">
                관리자
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-faint">
            가입일 {formatDate(user.created_at)}
          </p>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs text-ink-soft">맞은 문제</p>
          <p className="mt-1 text-2xl font-bold text-success">
            {stats.solvedCount}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-soft">제출 횟수</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {stats.totalSubmissions}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-soft">정답 횟수</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {stats.acSubmissions}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-soft">정답률</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {stats.acceptanceRate}%
          </p>
        </div>
      </section>

      {/* Verdict breakdown */}
      {stats.totalSubmissions > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 text-sm font-bold text-ink">제출 현황</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.verdictCounts).map(([v, c]) => (
              <span key={v} className="chip">
                {VERDICT_LABEL[v] ?? v}{" "}
                <span className="font-semibold text-ink">{c}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Solved problems */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-ink">
          맞은 문제{" "}
          <span className="text-ink-faint">({solvedProblems.length})</span>
        </h2>
        {solvedProblems.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-faint">
            아직 맞은 문제가 없습니다.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                  <th className="w-28 px-4 py-3">티어</th>
                  <th className="px-4 py-3">제목</th>
                  <th className="px-4 py-3 text-right">최단 바이트</th>
                </tr>
              </thead>
              <tbody>
                {solvedProblems.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
                  >
                    <td className="px-4 py-3">
                      <TierBadge tier={p.tier} showName size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/problems/${p.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                      {p.bytes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
