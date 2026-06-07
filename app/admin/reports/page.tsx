"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Report {
  id: number;
  target_type: "post" | "comment";
  target_id: number;
  reason: string;
  status: string;
  created_at: string;
  preview: string;
  postId: number | null;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);
  const [denied, setDenied] = useState(false);
  const [status, setStatus] = useState("open");

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) setDenied(true);
  }, [loading, user]);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}`, {
        cache: "no-store",
      });
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      const data = await res.json();
      setRows(data.reports ?? []);
    } finally {
      setFetching(false);
    }
  }, [status]);

  useEffect(() => {
    if (!loading && user?.isAdmin) load();
  }, [loading, user, load]);

  async function act(id: number, action: string) {
    if (
      action === "delete_target" &&
      !confirm("신고된 콘텐츠를 삭제하시겠습니까?")
    )
      return;
    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) load();
    else alert("처리에 실패했습니다.");
  }

  if (loading) {
    return (
      <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>
    );
  }
  if (denied) {
    return (
      <div className="space-y-4">
        <div className="card p-10 text-center text-sm text-ink-soft">
          관리자만 접근할 수 있습니다.
        </div>
        <button onClick={() => router.push("/")} className="btn-outlined">
          홈으로
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold text-ink">관리자 · 신고 관리</h1>
        <Link href="/admin" className="btn-outlined">
          문제 관리
        </Link>
      </div>

      <div className="flex gap-2">
        {[
          { v: "open", l: "처리 대기" },
          { v: "resolved", l: "처리됨" },
          { v: "dismissed", l: "기각" },
          { v: "all", l: "전체" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setStatus(t.v)}
            className={
              status === t.v
                ? "btn-filled px-3 py-1.5 text-xs"
                : "btn-outlined px-3 py-1.5 text-xs"
            }
          >
            {t.l}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          신고가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="card space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs text-ink-faint">
                <span className="rounded bg-surface-dim px-1.5 py-0.5 font-medium text-ink-soft">
                  {r.target_type === "post" ? "게시글" : "댓글"}
                </span>
                <span>#{r.target_id}</span>
                <span>·</span>
                <span>{formatTime(r.created_at)}</span>
                {r.status !== "open" && (
                  <span className="text-accent">
                    · {r.status === "resolved" ? "처리됨" : "기각"}
                  </span>
                )}
              </div>

              <div className="rounded border border-surface-border bg-surface-dim p-3 text-sm text-ink-soft">
                {r.preview || "(미리보기 없음)"}
              </div>

              {r.reason && (
                <p className="text-sm text-ink">
                  <span className="text-ink-faint">사유: </span>
                  {r.reason}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {r.postId && (
                  <Link
                    href={`/board/${r.postId}`}
                    className="btn-outlined px-3 py-1.5 text-xs"
                  >
                    원문 보기
                  </Link>
                )}
                {r.status === "open" && (
                  <>
                    <button
                      onClick={() => act(r.id, "delete_target")}
                      className="rounded-md border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
                    >
                      콘텐츠 삭제
                    </button>
                    <button
                      onClick={() => act(r.id, "resolve")}
                      className="btn-outlined px-3 py-1.5 text-xs"
                    >
                      처리 완료
                    </button>
                    <button
                      onClick={() => act(r.id, "dismiss")}
                      className="btn-outlined px-3 py-1.5 text-xs"
                    >
                      기각
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
