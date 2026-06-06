import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { Problem } from "@/lib/types";
import TierBadge from "@/components/TierBadge";

export const dynamic = "force-dynamic";

interface ProblemRow extends Problem {
  tier: number;
}

async function fetchProblems(): Promise<ProblemRow[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("problems")
      .select("id, title, description, input_desc, output_desc, tier, created_at")
      .order("tier", { ascending: true })
      .order("id", { ascending: true });
    if (error || !data) return [];
    return data as ProblemRow[];
  } catch {
    return [];
  }
}

export default async function ProblemsPage() {
  const problems = await fetchProblems();

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">문제 목록</h1>
          <p className="mt-1 text-sm text-ink-soft">
            티어 오름차순으로 정렬되어 있습니다.
          </p>
        </div>
        <span className="chip">{problems.length}문제</span>
      </div>

      {problems.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          문제가 없습니다. 마이그레이션과 시드 스크립트를 실행했는지
          확인하세요.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
                <th className="w-20 px-4 py-3">번호</th>
                <th className="w-28 px-4 py-3">티어</th>
                <th className="px-4 py-3">제목</th>
                <th className="hidden px-4 py-3 md:table-cell">설명</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b border-surface-border last:border-0 transition-colors hover:bg-surface-dim"
                >
                  <td className="px-4 py-3 font-mono text-ink-faint">
                    {i + 1}
                  </td>
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
                  <td className="hidden max-w-md truncate px-4 py-3 text-ink-soft md:table-cell">
                    {p.description}
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
