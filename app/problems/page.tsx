"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TierBadge from "@/components/TierBadge";
import { useAuth } from "@/components/AuthProvider";
import RandomProblemButton from "@/components/RandomProblemButton";

interface Row {
  id: number;
  title: string;
  tier: number;
  source: string | null;
  step_group: string | null;
  tags: string[] | null;
  solvedCount: number;
  acRate: number;
}

const TIER_OPTIONS = [
  { label: "전체 티어", value: "" },
  { label: "브론즈", value: "bronze", min: 1, max: 5 },
  { label: "실버", value: "silver", min: 6, max: 10 },
  { label: "골드", value: "gold", min: 11, max: 15 },
  { label: "플래티넘", value: "platinum", min: 16, max: 20 },
  { label: "다이아몬드", value: "diamond", min: 21, max: 25 },
  { label: "루비", value: "ruby", min: 26, max: 30 },
];

type Status = "solved" | "tried" | "none";

function StatusIcon({ status }: { status: Status }) {
  if (status === "solved") {
    return (
      <span title="맞은 문제" className="text-success">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
          <path
            d="M7 12.5l3.2 3.2L17 9"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (status === "tried") {
    return (
      <span title="시도했지만 못 푼 문제" className="text-danger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        </svg>
      </span>
    );
  }
  return <span className="inline-block h-4 w-4" aria-hidden />;
}

export default function ProblemsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [tierGroup, setTierGroup] = useState("");
  const [stepGroup, setStepGroup] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<"tier" | "id">("tier");
  const [unsolvedOnly, setUnsolvedOnly] = useState(false);

  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [tried, setTried] = useState<Set<number>>(new Set());
  const [stepGroups, setStepGroups] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);

  // Read an initial ?tag= filter from the URL (e.g. from a problem page).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("tag");
    if (t) setTag(t);
  }, []);

  // Load tags for the filter dropdown.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/problems/tags", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setTags(d.tags ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Load step groups for the filter dropdown.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/step-groups", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStepGroups(d.groups ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the user's solve status once (and when login changes).
  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      if (!user) {
        setSolved(new Set());
        setTried(new Set());
        return;
      }
      try {
        const res = await fetch("/api/me/solved", { cache: "no-store" });
        const d = await res.json();
        if (cancelled) return;
        setSolved(new Set<number>(d.solved ?? []));
        setTried(new Set<number>(d.tried ?? []));
      } catch {
        /* ignore */
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("sort", sort);
      params.set("page", String(page));
      if (stepGroup) params.set("group", stepGroup);
      if (tag) params.set("tag", tag);
      if (unsolvedOnly) params.set("unsolved", "1");
      const opt = TIER_OPTIONS.find((o) => o.value === tierGroup);
      if (opt && opt.min !== undefined) {
        params.set("tierMin", String(opt.min));
        params.set("tierMax", String(opt.max));
      }
      const res = await fetch(`/api/problems?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        problems: Row[];
        total: number;
        pageSize: number;
      };
      setRows(data.problems ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 20);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query, sort, page, tierGroup, stepGroup, tag, unsolvedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

  function statusOf(id: number): Status {
    if (solved.has(id)) return "solved";
    if (tried.has(id)) return "tried";
    return "none";
  }

  const visibleRows = rows;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageNumbers: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">전체 문제</h1>
        </div>
        <div className="flex items-center gap-2">
          <RandomProblemButton className="btn-text" />
          <Link href="/steps" className="btn-text">
            단계별로 풀기 →
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="card space-y-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={submitSearch} className="flex flex-1 gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="문제 제목 검색"
              className="field flex-1"
            />
            <button type="submit" className="btn-filled px-4">
              검색
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            <select
              value={tierGroup}
              onChange={(e) => {
                setTierGroup(e.target.value);
                setPage(1);
              }}
              className="field w-auto"
            >
              {TIER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={stepGroup}
              onChange={(e) => {
                setStepGroup(e.target.value);
                setPage(1);
              }}
              className="field w-auto"
            >
              <option value="">전체 단계</option>
              {stepGroups.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
            <select
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setPage(1);
              }}
              className="field w-auto"
            >
              <option value="">전체 태그</option>
              {tags.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.count})
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as "tier" | "id");
                setPage(1);
              }}
              className="field w-auto"
            >
              <option value="tier">티어순</option>
              <option value="id">등록순</option>
            </select>
          </div>
        </div>
        {user && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={unsolvedOnly}
              onChange={(e) => {
                setUnsolvedOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 accent-accent"
            />
            안 푼 문제만 보기
          </label>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          불러오는 중…
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          {query
            ? `"${query}" 검색 결과가 없습니다.`
            : unsolvedOnly
              ? "안 푼 문제가 없습니다. 모든 문제를 풀었어요!"
              : "문제가 없습니다."}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                {user && <th className="w-10 px-2 py-3 text-center">상태</th>}
                <th className="w-28 px-4 py-3">티어</th>
                <th className="px-4 py-3">제목</th>
                <th className="hidden w-24 px-4 py-3 text-right sm:table-cell">
                  맞은 사람
                </th>
                <th className="hidden w-20 px-4 py-3 text-right sm:table-cell">
                  정답률
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
                >
                  {user && (
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex justify-center">
                        <StatusIcon status={statusOf(p.id)} />
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <TierBadge tier={p.tier} showName size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/problems/${p.id}`}
                      className={`font-medium hover:underline ${
                        user && statusOf(p.id) === "solved"
                          ? "text-success"
                          : user && statusOf(p.id) === "tried"
                            ? "text-danger"
                            : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-ink-soft sm:table-cell">
                    {p.solvedCount}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-ink-faint sm:table-cell">
                    {p.solvedCount > 0 ? `${p.acRate}%` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="rounded-md px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-surface-variant disabled:opacity-40"
          >
            처음
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-surface-variant disabled:opacity-40"
          >
            이전
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                n === page
                  ? "bg-accent font-semibold text-white"
                  : "text-ink-soft hover:bg-surface-variant"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-surface-variant disabled:opacity-40"
          >
            다음
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="rounded-md px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-surface-variant disabled:opacity-40"
          >
            끝
          </button>
        </div>
      )}
    </div>
  );
}
