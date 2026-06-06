"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface PostRow {
  id: number;
  author: string;
  title: string;
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

export default function BoardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/board", { cache: "no-store" });
        const data = (await res.json()) as { posts?: PostRow[]; error?: string };
        if (cancelled) return;
        if (!res.ok) setError(data.error ?? "불러오기 실패");
        else setPosts(data.posts ?? []);
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
  }, []);

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

      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          불러오는 중…
        </div>
      ) : error ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          아직 글이 없습니다. 첫 글을 작성해 보세요.
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
              {posts.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
                >
                  <td className="px-4 py-3 font-mono text-ink-faint">
                    {posts.length - i}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/board/${p.id}`}
                      className="font-medium text-ink hover:text-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                    {p.comment_count > 0 && (
                      <span className="ml-2 text-xs font-semibold text-primary">
                        [{p.comment_count}]
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">
                    {p.author}
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
