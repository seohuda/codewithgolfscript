import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { Problem } from "@/lib/types";
import ProblemWorkspace from "@/components/ProblemWorkspace";
import TierBadge from "@/components/TierBadge";

export const dynamic = "force-dynamic";

interface ProblemRow extends Problem {
  tier: number;
}

async function fetchProblem(id: number): Promise<ProblemRow | null> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("problems")
      .select("id, title, description, input_desc, output_desc, tier, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as ProblemRow;
  } catch {
    return null;
  }
}

export default async function ProblemPage({
  params,
}: {
  params: { id: string };
}) {
  const problemId = Number(params.id);
  if (!Number.isFinite(problemId) || problemId <= 0) notFound();

  const problem = await fetchProblem(problemId);
  if (!problem) notFound();

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/problems" className="hover:text-primary hover:underline">
          문제
        </Link>
        <span>/</span>
        <span className="font-mono text-ink-soft">#{problem.id}</span>
      </div>

      <div className="flex items-center gap-3">
        <TierBadge tier={problem.tier} showName />
        <h1 className="text-2xl font-bold text-ink">{problem.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: description */}
        <section className="space-y-4">
          <div className="card p-6">
            <h2 className="mb-2 text-sm font-bold text-ink">문제</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {problem.description}
            </p>
          </div>
          <div className="card p-6">
            <h2 className="mb-2 text-sm font-bold text-ink">입력</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {problem.input_desc || "—"}
            </p>
          </div>
          <div className="card p-6">
            <h2 className="mb-2 text-sm font-bold text-ink">출력</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {problem.output_desc || "—"}
            </p>
          </div>
          <div className="rounded-lg border border-surface-border bg-surface-dim p-4 text-xs leading-relaxed text-ink-faint">
            제출 코드는 내장 GolfScript 인터프리터에서 실행됩니다. 표준 입력으로
            읽고 표준 출력으로 씁니다. 출력은 양 끝 공백을 제거한 뒤 비교하며,
            순위는 정확한 UTF-8 바이트 크기로 매겨집니다.
          </div>
        </section>

        {/* Right: editor + leaderboard */}
        <section>
          <ProblemWorkspace problemId={problem.id} />
        </section>
      </div>
    </div>
  );
}
