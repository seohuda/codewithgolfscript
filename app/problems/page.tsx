"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TierBadge from "@/components/TierBadge";
import { getTierInfo } from "@/lib/tiers";

interface Row {
  id: number;
  title: string;
  tier: number;
  source: string | null;
  step_group: string | null;
}

// Tier filter options: group representative tiers.
const TIER_OPTIONS = [
  { label: "전체 티어", value: "" },
  { label: "브론즈", value: "bronze", min: 1, max: 5 },
  { label: "실버", value: "silver", min: 6, max: 10 },
  { label: "골드", value: "gold", min: 11, max: 15 },
  { label: "플래티넘", value: "platinum", min: 16, max: 20 },
  { label: "다이아몬드", value: "diamond", min: 21, max: 25 },
  { label: "루비", value: "ruby", min: 26, max: 30 },
];

export default function ProblemsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(""); // bronze/silver/...
  const [sort, setSort] = useState<"tier" | "id">("tier");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("sort", sort);
      params.set("page", String(page));
      const opt = TIER_OPTIONS.find((o) => o.value === group);
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
  }, [query, sort, page, group]);

  useEffect(() => {
    load();
  }, [load]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

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
          <p className="mt-1 text-sm text-ink-soft">
            제목으로 검색하고 티어로 거를 수 있습니다.
          </p>
        </div>
        <Link href="/steps" className="btn-text">
          단계별로 풀기 →
        </Link>
      </div>

      {/* Controls */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
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
        <div className="flex gap-2">
          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
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

      {/* Results */}
      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          불러오는 중…
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          {query ? `"${query}" 검색 결과가 없습니다.` : "문제가 없습니다."}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                <th className="w-28 px-4 py-3">티어</th>
                <th className="px-4 py-3">제목</th>
                <th className="hidden px-4 py-3 text-right md:table-cell">
                  출처
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
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
                  <td className="hidden px-4 py-3 text-right text-xs text-ink-faint md:table-cell">
                    {p.source && !p.source.startsWith("자체 제작")
                      ? p.source
                      : ""}
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
                  ? "bg-primary font-semibold text-white"
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
