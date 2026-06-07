"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface PostRow {
  id: number;
  author: string;
  author_is_admin: boolean;
  title: string;
  is_notice: boolean;
  created_at: string;
  comment_count: number;
}

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

const TABS = [
  { key: "all", label: "전체" },
  { key: "notice", label: "공지" },
  { key: "normal", label: "일반" },
];

export default function BoardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/board?type=${tab}`, { cache: "no-store" });
      const data = (await res.json()) as { posts?: PostRow[]; error?: string };
      if (!res.ok) setError(data.error ?? "불러오기 실패");
      else {
        setError(null);
        setPosts(data.posts ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  // For the "전체" tab, show notices first.
  const sorted =
    tab === "all"
      ? [...posts].sort(
          (a, b) => Number(b.is_notice) - Number(a.is_notice),
        )
      : posts;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">게시판</h1>
          <p className="mt-1 text-sm text-ink-soft">
            풀이와 질문을 자유롭게 공유하세요.
          </p>
        </div>
        {user ? (
          <Link href="/board/write" className="btn-filled">
            글쓰기
          </Link>
        ) : (
          <Link href="/login" className="btn-outlined">
            로그인하고 글쓰기
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          불러오는 중…
        </div>
      ) : error ? (
        <div className="card p-10 text-center text-sm text-ink-soft">{error}</div>
      ) : sorted.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          {tab === "notice" ? "공지가 없습니다." : "아직 글이 없습니다."}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                <th className="w-16 px-4 py-3">번호</th>
                <th className="px-4 py-3">제목</th>
                <th className="hidden w-32 px-4 py-3 sm:table-cell">작성자</th>
                <th className="hidden w-40 px-4 py-3 md:table-cell">작성일</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-surface-border last:border-0 hover:bg-surface-dim ${
                    p.is_notice ? "bg-primary-container/20" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    {p.is_notice ? (
                      <span className="bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                        공지
                      </span>
                    ) : (
                      <span className="font-mono text-ink-faint">
                        {sorted.length - i}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/board/${p.id}`}
                      className="font-medium text-ink hover:text-accent hover:underline"
                    >
                      {p.title}
                    </Link>
                    {p.comment_count > 0 && (
                      <span className="ml-2 text-xs font-semibold text-accent">
                        [{p.comment_count}]
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span
                      className={
                        p.author_is_admin
                          ? "font-semibold text-accent"
                          : "text-ink-soft"
                      }
                    >
                      {p.author}
                      {p.author_is_admin && " (관리자)"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-ink-faint md:table-cell">
                    {formatTime(p.created_at)}
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
