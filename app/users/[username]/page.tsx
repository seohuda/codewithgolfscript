"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TierBadge from "@/components/TierBadge";
import ActivityGraph from "@/components/ActivityGraph";
import BadgeGrid from "@/components/BadgeGrid";
import { getTierInfo } from "@/lib/tiers";
import { useAuth } from "@/components/AuthProvider";

interface SolvedProblem {
  id: number;
  title: string;
  tier: number;
  bytes: number;
}

interface ProfileData {
  user: {
    username: string;
    created_at: string;
    is_admin: boolean;
    bio: string;
    featured_badge: string | null;
    followers: number;
    following: number;
    isFollowing: boolean;
    isMe: boolean;
  };
  stats: {
    totalSubmissions: number;
    acSubmissions: number;
    solvedCount: number;
    acceptanceRate: number;
    totalBytes: number;
    verdictCounts: Record<string, number>;
    score: number;
    userTier: number;
  };
  solvedProblems: SolvedProblem[];
  activity: Record<string, number>;
  badges: { id: string; name: string; desc: string; earned: boolean }[];
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
  const { user: me } = useAuth();

  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [badgeDraft, setBadgeDraft] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`/api/users/${username}`, { cache: "no-store" });
    const d = await res.json();
    if (res.ok) {
      setData(d as ProfileData);
      setFollowing(d.user.isFollowing);
      setFollowers(d.user.followers);
      setBioDraft(d.user.bio ?? "");
      setBadgeDraft(d.user.featured_badge ?? null);
    }
    return { res, d };
  }

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
          setFollowing(d.user.isFollowing);
          setFollowers(d.user.followers);
          setBioDraft(d.user.bio ?? "");
          setBadgeDraft(d.user.featured_badge ?? null);
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

  async function toggleFollow() {
    if (!me || busy) return;
    setBusy(true);
    const method = following ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method });
      if (res.ok) {
        setFollowing(!following);
        setFollowers((n) => n + (following ? -1 : 1));
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    setBusy(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioDraft, featuredBadge: badgeDraft }),
      });
      if (res.ok) {
        setEditing(false);
        await reload();
      }
    } finally {
      setBusy(false);
    }
  }

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
  const earnedBadges = (data.badges ?? []).filter((b) => b.earned);
  const featured =
    user.featured_badge
      ? (data.badges ?? []).find((b) => b.id === user.featured_badge && b.earned)
      : null;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header card */}
      <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-1">
          <TierBadge tier={stats.userTier} />
          <span
            className="text-xs font-bold"
            style={{ color: getTierInfo(stats.userTier).color }}
          >
            {getTierInfo(stats.userTier).nameKo}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className="text-2xl font-bold"
              style={{ color: getTierInfo(stats.userTier).color }}
            >
              {user.username}
            </h1>
            {user.is_admin && (
              <span className="chip border-primary/30 bg-primary-container/50 text-accent">
                관리자
              </span>
            )}
            {featured && (
              <span className="chip border-accent/30 bg-accent/10 text-accent">
                {featured.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-faint">
            가입일 {formatDate(user.created_at)}
          </p>
          <div className="mt-2 flex gap-4 text-sm">
            <Link
              href={`/users/${encodeURIComponent(user.username)}/follows?type=followers`}
              className="text-ink-soft hover:text-accent hover:underline"
            >
              팔로워 <span className="font-bold text-ink">{followers}</span>
            </Link>
            <Link
              href={`/users/${encodeURIComponent(user.username)}/follows?type=following`}
              className="text-ink-soft hover:text-accent hover:underline"
            >
              팔로잉 <span className="font-bold text-ink">{user.following}</span>
            </Link>
          </div>
          {user.bio && !editing && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">
              {user.bio}
            </p>
          )}
          {/* Follow / edit controls */}
          <div className="mt-3 flex flex-wrap gap-2">
            {me && !user.isMe && (
              <button
                onClick={toggleFollow}
                disabled={busy}
                className={
                  following
                    ? "btn-outlined px-4 py-1.5 text-sm"
                    : "btn-filled px-4 py-1.5 text-sm"
                }
              >
                {following ? "팔로잉" : "팔로우"}
              </button>
            )}
            {user.isMe && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-outlined px-4 py-1.5 text-sm"
              >
                프로필 편집
              </button>
            )}
          </div>

          {editing && (
            <div className="mt-3 space-y-3 border-t border-surface-border pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink">자기소개</label>
                <textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="자기소개를 입력하세요 (최대 300자)"
                  className="field resize-y text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink">대표 뱃지</label>
                <select
                  value={badgeDraft ?? ""}
                  onChange={(e) => setBadgeDraft(e.target.value || null)}
                  className="field text-sm"
                >
                  <option value="">없음</option>
                  {earnedBadges.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveProfile}
                  disabled={busy}
                  className="btn-filled px-4 py-1.5 text-sm"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setBioDraft(user.bio ?? "");
                    setBadgeDraft(user.featured_badge ?? null);
                  }}
                  className="btn-outlined px-4 py-1.5 text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-soft">점수</p>
          <p className="text-2xl font-bold text-accent">{stats.score}</p>
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
          <p className="mt-1 text-2xl font-bold text-accent">
            {stats.acceptanceRate}%
          </p>
        </div>
      </section>

      {/* Activity graph */}
      <ActivityGraph activity={data.activity ?? {}} />

      <BadgeGrid badges={data.badges ?? []} />

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
                        className="font-medium text-accent hover:underline"
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
