import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { Problem } from "@/lib/types";
import { getTierInfo } from "@/lib/tiers";
import ProblemWorkspace from "@/components/ProblemWorkspace";
import TierBadge from "@/components/TierBadge";
import ProblemStatusBadge from "@/components/ProblemStatusBadge";
import DifficultyVote from "@/components/DifficultyVote";

export const dynamic = "force-dynamic";

async function fetchProblem(id: number): Promise<Problem | null> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("problems")
      .select(
        "id, title, description, input_desc, output_desc, tier, source, sample_input, sample_output, image_url, tags, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Problem;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return { title: "문제를 찾을 수 없습니다" };
  }
  const problem = await fetchProblem(id);
  if (!problem) {
    return { title: "문제를 찾을 수 없습니다" };
  }

  const tierName = getTierInfo(problem.tier ?? 0).nameKo;
  const desc = (problem.description ?? "").slice(0, 150);
  const tags = (problem.tags ?? []).join(", ");
  const summary =
    `[${tierName}] ${desc}` + (tags ? ` · 태그: ${tags}` : "");

  return {
    title: problem.title,
    description: summary,
    openGraph: {
      title: `${problem.title} · CODE WITH GOLFSCRIPT`,
      description: summary,
      type: "article",
      url: `/problems/${problem.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${problem.title} · CODE WITH GOLFSCRIPT`,
      description: summary,
    },
  };
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

      {problem.tags && problem.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {problem.tags.map((tag) => (
            <Link
              key={tag}
              href={`/problems?tag=${encodeURIComponent(tag)}`}
              className="border border-surface-border bg-surface-variant px-2 py-0.5 text-xs text-ink-soft hover:text-accent"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: description */}
        <section className="space-y-4">
          <div className="card p-6">
            <h2 className="mb-2 text-sm font-bold text-ink">문제</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {problem.description}
            </p>
            {problem.image_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={problem.image_url}
                alt={`${problem.title} 이미지`}
                className="mt-4 max-w-full border border-surface-border"
              />
            )}
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

          <DifficultyVote problemId={problem.id} />
        </section>

        {/* Right: editor + leaderboard */}
        <section>
          <ProblemWorkspace problemId={problem.id} />
        </section>
      </div>
    </div>
  );
}
