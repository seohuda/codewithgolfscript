import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { Problem } from "@/lib/types";
import ProblemWorkspace from "@/components/ProblemWorkspace";
import TierBadge from "@/components/TierBadge";
import ProblemStatusBadge from "@/components/ProblemStatusBadge";

export const dynamic = "force-dynamic";

async function fetchProblem(id: number): Promise<Problem | null> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("problems")
      .select(
        "id, title, description, input_desc, output_desc, tier, source, sample_input, sample_output, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Problem;
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

  const hasSample =
    (problem.sample_input ?? "").length > 0 ||
    (problem.sample_output ?? "").length > 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/problems" className="hover:text-accent hover:underline">
          문제
        </Link>
        <span>/</span>
        <span className="font-mono text-ink-soft">#{problem.id}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TierBadge tier={problem.tier ?? 0} showName />
        <h1 className="text-2xl font-bold text-ink">{problem.title}</h1>
        <ProblemStatusBadge problemId={problem.id} />
      </div>

      {problem.source && !problem.source.startsWith("자체 제작") && (
        <p className="text-xs text-ink-faint">
          출처: <span className="text-ink-soft">{problem.source}</span>
        </p>
      )}

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

          {hasSample && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="card overflow-hidden">
                <div className="border-b border-surface-border bg-surface-dim px-4 py-2 text-xs font-bold text-ink-soft">
                  예제 입력
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-sm text-ink">
                  {problem.sample_input || "(없음)"}
                </pre>
              </div>
              <div className="card overflow-hidden">
                <div className="border-b border-surface-border bg-surface-dim px-4 py-2 text-xs font-bold text-ink-soft">
                  예제 출력
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-sm text-ink">
                  {problem.sample_output || "(없음)"}
                </pre>
              </div>
            </div>
          )}

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
