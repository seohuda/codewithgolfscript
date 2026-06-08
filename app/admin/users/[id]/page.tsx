"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Submission {
  id: string;
  problemId: number;
  problemTitle: string;
  code: string;
  bytes: number;
  verdict: string;
  created_at: string;
}

interface TargetUser {
  id: string;
  username: string;
  email: string | null;
  isAdmin: boolean;
  bannedUntil: string | null;
  suspended: boolean;
  suspendedReason: string | null;
  createdAt: string;
}

const VERDICT_META: Record<string, { color: string; bg: string }> = {
  AC: { color: "#188038", bg: "#e6f4ea" },
  WA: { color: "#d93025", bg: "#fce8e6" },
  TLE: { color: "#e37400", bg: "#fef7e0" },
  RE: { color: "#d93025", bg: "#fce8e6" },
  CE: { color: "#d93025", bg: "#fce8e6" },
  PENDING: { color: "#5f6368", bg: "#f1f3f4" },
};

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

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, loading } = useAuth();

  const [target, setTarget] = useState<TargetUser | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [fetching, setFetching] = useState(true);
  const [denied, setDenied] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  async function sendReset() {
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/reset`, {
        method: "POST",
      });
      const d = await res.json();
      if (res.ok) {
        setResetMsg(
          d.emailSent
            ? "재설정 메일을 발송했고 잠금을 해제했습니다."
            : "잠금은 해제했지만 메일 발송에 실패했습니다.",
        );
      } else {
        setResetMsg(d.error ?? "발송에 실패했습니다.");
      }
    } catch {
      setResetMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setResetting(false);
    }
  }

  async function doAction(action: "suspend" | "unsuspend" | "delete") {
    if (action === "delete") {
      if (!confirm("이 계정을 영구 삭제할까요? 제출/기록도 함께 삭제됩니다.")) return;
    }
    let reason = "";
    if (action === "suspend") {
      reason = prompt("정지 사유 (선택):") ?? "";
    }
    setResetMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const d = await res.json();
      if (!res.ok) {
        setResetMsg(d.error ?? "작업에 실패했습니다.");
        return;
      }
      if (action === "delete") {
        router.push("/admin/users");
        router.refresh();
        return;
      }
      load();
    } catch {
      setResetMsg("네트워크 오류가 발생했습니다.");
    }
  }

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) setDenied(true);
  }, [loading, user]);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(
        `/api/admin/users/${id}/submissions?page=${page}`,
        { cache: "no-store" },
      );
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setTarget(data.user ?? null);
        setSubs(data.submissions ?? []);
        setTotal(data.total ?? 0);
        setPageSize(data.pageSize ?? 20);
      }
    } finally {
      setFetching(false);
    }
  }, [id, page]);

  useEffect(() => {
    if (!loading && user?.isAdmin) load();
  }, [loading, user, load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/admin/users" className="hover:text-accent hover:underline">
          유저 관리
        </Link>
        <span>/</span>
        <span className="text-ink-soft">{target?.username ?? id}</span>
      </div>

      {target && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-ink">{target.username}</h1>
            {target.isAdmin && (
              <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                관리자
              </span>
            )}
            {target.suspended && (
              <span className="rounded bg-danger/15 px-2 py-0.5 text-xs font-bold text-danger">
                정지됨
              </span>
            )}
            <Link
              href={`/users/${encodeURIComponent(target.username)}`}
              className="text-xs font-medium text-accent hover:underline"
            >
              공개 프로필 →
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-faint">
            <span>이메일: {target.email ?? "-"}</span>
            <span>가입: {formatTime(target.createdAt)}</span>
            <span>제출 수: {total}</span>
          </div>
          <p className="mt-3 text-[11px] text-ink-faint">
            이 페이지의 제출 코드 열람은 모니터링 기록에 남깁니다.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={sendReset}
              disabled={resetting || !target.email}
              className="btn-outlined px-3 py-1.5 text-xs"
            >
              {resetting ? "발송 중…" : "비밀번호 재설정 메일 보내기"}
            </button>
            {!target.isAdmin && !target.suspended && (
              <button
                onClick={() => doAction("suspend")}
                className="rounded-md border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
              >
                계정 정지
              </button>
            )}
            {!target.isAdmin && target.suspended && (
              <button
                onClick={() => doAction("unsuspend")}
                className="btn-outlined px-3 py-1.5 text-xs"
              >
                정지 해제
              </button>
            )}
            {!target.isAdmin && (
              <button
                onClick={() => doAction("delete")}
                className="rounded-md border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
              >
                계정 삭제
              </button>
            )}
            {resetMsg && (
              <span className="text-xs text-ink-soft">{resetMsg}</span>
            )}
          </div>
        </div>
      )}

      {fetching ? (
        <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>
      ) : subs.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          제출 기록이 없습니다.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                <th className="px-4 py-3">문제</th>
                <th className="w-20 px-4 py-3">결과</th>
                <th className="w-20 px-4 py-3 text-right">바이트</th>
                <th className="hidden w-40 px-4 py-3 text-right sm:table-cell">
                  제출 시각
                </th>
                <th className="w-16 px-4 py-3 text-right">코드</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const meta = VERDICT_META[s.verdict] ?? VERDICT_META.PENDING;
                const isOpen = expanded === s.id;
                return (
                  <Fragment key={s.id}>
                    <tr className="border-b border-surface-border last:border-0 hover:bg-surface-dim">
                      <td className="px-4 py-3">
                        <Link
                          href={`/problems/${s.problemId}`}
                          className="font-medium text-accent hover:underline"
                        >
                          {s.problemTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-md px-2 py-0.5 font-mono text-xs font-bold"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {s.verdict}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                        {s.bytes}
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-xs text-ink-faint sm:table-cell">
                        {formatTime(s.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setExpanded(isOpen ? null : s.id)}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          {isOpen ? "닫기" : "보기"}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-surface-dim">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="overflow-x-auto rounded-lg border border-surface-border bg-surface p-3 font-mono text-sm text-ink">
                            {s.code}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!fetching && total > pageSize && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-variant disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-sm text-ink-soft">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-variant disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
