import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { Problem } from "@/lib/types";
import ProblemWorkspace from "@/components/ProblemWorkspace";

export const dynamic = "force-dynamic";

async function fetchProblem(id: number): Promise<Problem | null> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("problems")
      .select("id, title, description, input_desc, output_desc, created_at")
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
  if (!Number.isFinite(problemId) || problemId <= 0) {
    notFound();
  }

  const problem = await fetchProblem(problemId);
  if (!problem) {
    notFound();
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-2 text-xs text-mist-dim">
        <Link href="/" className="transition-colors hover:text-mist">
          문제
        </Link>
        <span>/</span>
        <span className="font-mono text-mist-soft">
          #{String(problem.id).padStart(3, "0")}
        </span>
      </div>

      {/* Gemini-style minimalist split layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: problem description */}
        <section className="space-y-8">
          <header className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-aurora-glow">
                #{String(problem.id).padStart(3, "0")}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-aurora-indigo/40 to-transparent" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-mist">
              {problem.title}
            </h1>
          </header>

          <div className="panel space-y-8 p-7">
            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-aurora-glow">
                설명
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-mist-soft">
                {problem.description}
              </p>
            </div>

            <div className="h-px w-full bg-white/[0.06]" />

            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-aurora-glow">
                입력
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-mist-soft">
                {problem.input_desc || "—"}
              </p>
            </div>

            <div className="h-px w-full bg-white/[0.06]" />

            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-aurora-glow">
                출력
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-mist-soft">
                {problem.output_desc || "—"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-abyss-800/40 p-5">
            <p className="text-xs leading-relaxed text-mist-dim">
              제출한 코드는 내장 GolfScript 인터프리터에서 실행됩니다. 프로그램은{" "}
              <code className="rounded bg-abyss-700 px-1 py-0.5 font-mono text-aurora-glow">
                표준 입력
              </code>
              에서 읽고{" "}
              <code className="rounded bg-abyss-700 px-1 py-0.5 font-mono text-aurora-glow">
                표준 출력
              </code>
              으로 씁니다. 출력은 양 끝 공백을 제거한 뒤 비교하며, 순위는 정확한
              UTF-8 바이트 크기로 매겨집니다.
            </p>
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
