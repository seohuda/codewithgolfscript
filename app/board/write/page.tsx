"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function WritePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          isNotice,
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "작성에 실패했습니다.");
        return;
      }
      router.push(`/board/${data.id}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/board" className="hover:text-accent hover:underline">
          게시판
        </Link>
        <span>/</span>
        <span className="text-ink-soft">글쓰기</span>
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
            placeholder="제목을 입력하세요"
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
            placeholder="내용을 입력하세요"
            className="field resize-y"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        {user?.isAdmin && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isNotice}
              onChange={(e) => setIsNotice(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            공지로 등록 (관리자)
          </label>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-filled">
            {submitting ? "등록 중…" : "등록"}
          </button>
          <Link href="/board" className="btn-outlined">
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
