"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Post {
  id: number;
  author: string;
  title: string;
  body: string;
  created_at: string;
  comment_count: number;
}

interface Comment {
  id: number;
  author: string;
  body: string;
  created_at: string;
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

export default function PostDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/board/${id}`, { cache: "no-store" });
      const data = (await res.json()) as {
        post?: Post;
        comments?: Comment[];
        error?: string;
      };
      if (!res.ok || !data.post) {
        setError(data.error ?? "글을 불러오지 못했습니다.");
        return;
      }
      setPost(data.post);
      setComments(data.comments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/board/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment.trim() }),
      });
      if (res.ok) {
        setComment("");
        await load();
      }
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-10 text-center text-sm text-ink-faint">
        불러오는 중…
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-4">
        <div className="card p-10 text-center text-sm text-ink-soft">
          {error ?? "글을 찾을 수 없습니다."}
        </div>
        <Link href="/board" className="btn-outlined">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/board" className="hover:text-primary hover:underline">
          게시판
        </Link>
        <span>/</span>
        <span className="font-mono text-ink-soft">#{post.id}</span>
      </div>

      <article className="card p-6">
        <h1 className="text-xl font-bold text-ink">{post.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-xs text-ink-faint">
          <span className="font-medium text-ink-soft">{post.author}</span>
          <span>{formatTime(post.created_at)}</span>
        </div>
        <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {post.body || "(내용 없음)"}
        </div>
      </article>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-ink">
          댓글 <span className="text-primary">{comments.length}</span>
        </h2>

        {comments.length > 0 && (
          <div className="card divide-y divide-surface-border">
            {comments.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex items-center gap-2 text-xs text-ink-faint">
                  <span className="font-medium text-ink-soft">{c.author}</span>
                  <span>{formatTime(c.created_at)}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {user ? (
          <form onSubmit={submitComment} className="card space-y-3 p-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="댓글을 입력하세요"
              className="field resize-y"
            />
            <button type="submit" disabled={posting} className="btn-filled">
              {posting ? "등록 중…" : "댓글 등록"}
            </button>
          </form>
        ) : (
          <div className="card p-4 text-center text-sm text-ink-soft">
            <Link href="/login" className="font-medium text-primary hover:underline">
              로그인
            </Link>{" "}
            후 댓글을 작성할 수 있습니다.
          </div>
        )}
      </section>

      <Link href="/board" className="btn-outlined">
        목록으로
      </Link>
    </div>
  );
}
