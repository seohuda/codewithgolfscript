"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/board/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.post) {
        setError(data.error ?? "글을 불러오지 못했습니다.");
        return;
      }
      // Only the owner may edit.
      if (user && data.post.user_id !== user.id) {
        setError("본인 글만 수정할 수 있습니다.");
        return;
      }
      setTitle(data.post.title);
      setBody(data.post.body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user) load();
  }, [authLoading, user, load, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/board/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "수정에 실패했습니다.");
        return;
      }
      router.push(`/board/${id}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-10 text-center text-sm text-ink-faint">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href={`/board/${id}`} className="hover:text-primary hover:underline">
          글로 돌아가기
        </Link>
        <span>/</span>
        <span className="text-ink-soft">수정</span>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium text-ink">
            제목
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="field"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="body" className="text-sm font-medium text-ink">
            내용
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="field resize-y"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-filled">
            {submitting ? "저장 중…" : "수정 완료"}
          </button>
          <Link href={`/board/${id}`} className="btn-outlined">
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
