import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { Problem } from "@/lib/types";

export const dynamic = "force-dynamic";

async function fetchProblems(): Promise<Problem[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("problems")
      .select("id, title, description, input_desc, output_desc, created_at")
      .order("id", { ascending: true });

    if (error || !data) return [];
    return data as Problem[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const problems = await fetchProblems();

  return (
    <div className="animate-fade-in space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-abyss-800/40 px-8 py-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-aurora-violet/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-aurora-cyan/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-aurora-glow">
            GolfScript Only
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-mist md:text-5xl">
            Win with the{" "}
            <span className="aurora-text">fewest bytes</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-mist-soft">
            A short-coding judge built for the maniacs. Every solution is
            measured by its exact UTF-8 byte size. Solve the problem, then
            shrink it until nothing remains but signal.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-lg font-medium tracking-wide text-mist">
            Problems
          </h2>
          <span className="text-xs text-mist-dim">
            {problems.length} available
          </span>
        </div>

        {problems.length === 0 ? (
          <div className="panel px-6 py-12 text-center">
            <p className="text-sm text-mist-soft">
              No problems found. Configure Supabase and run{" "}
              <code className="rounded bg-abyss-700 px-1.5 py-0.5 font-mono text-xs text-aurora-glow">
                sql/schema.sql
              </code>{" "}
              to seed the database.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.04] md:grid-cols-2 lg:grid-cols-3">
            {problems.map((p) => (
              <li key={p.id} className="bg-abyss-800/60">
                <Link
                  href={`/problems/${p.id}`}
                  className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-abyss-700/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-mist-dim">
                      #{String(p.id).padStart(3, "0")}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-aurora-glow opacity-0 transition-opacity group-hover:opacity-100">
                      Solve &rarr;
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-mist transition-colors group-hover:text-white">
                    {p.title}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-mist-soft">
                    {p.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
