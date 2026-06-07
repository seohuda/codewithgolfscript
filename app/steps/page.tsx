import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import StepProblemList from "@/components/StepProblemList";
import { STEP_GROUPS } from "@/scripts/problems.steps";

export const dynamic = "force-dynamic";

interface Row {
  id: number;
  title: string;
  tier: number;
  step_group: string;
  step_order: number;
}

async function fetchProblems(): Promise<Row[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("problems")
      .select("id, title, tier, step_group, step_order")
      .order("step_order", { ascending: true })
      .range(0, 999);
    if (error || !data) return [];
    return data as Row[];
  } catch {
    return [];
  }
}

export default async function StepsPage() {
  const problems = await fetchProblems();

  // Group by step_group, preserving the order defined in STEP_GROUPS.
  const byGroup = new Map<string, Row[]>();
  for (const p of problems) {
    const g = p.step_group || "기타";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(p);
  }
  for (const list of byGroup.values()) {
    list.sort((a, b) => a.step_order - b.step_order);
  }

  const orderedGroups = STEP_GROUPS.map((g) => g.name).filter((n) =>
    byGroup.has(n),
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">단계별로 풀기</h1>
        <p className="mt-1 text-sm text-ink-soft">
          기초부터 차근차근. 위에서 아래로 순서대로 풀어 보세요.
        </p>
      </div>

      {orderedGroups.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          아직 단계 정보가 없습니다. 마이그레이션과 시드를 실행했는지
          확인하세요.
        </div>
      ) : (
        <div className="space-y-5">
          {orderedGroups.map((groupName, gi) => {
            const meta = STEP_GROUPS.find((g) => g.name === groupName);
            const list = byGroup.get(groupName)!;
            return (
              <section key={groupName} className="card overflow-hidden">
                <div className="flex items-center gap-3 border-b border-surface-border bg-surface-dim px-5 py-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {gi + 1}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-ink">{groupName}</h2>
                    {meta?.desc && (
                      <p className="text-xs text-ink-faint">{meta.desc}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-ink-faint">
                    {list.length}문제
                  </span>
                </div>
                <StepProblemList
                  problems={list.map((p) => ({
                    id: p.id,
                    title: p.title,
                    tier: p.tier,
                  }))}
                />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
