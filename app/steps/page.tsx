import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import StepProblemList from "@/components/StepProblemList";

export const dynamic = "force-dynamic";

interface Row {
  id: number;
  title: string;
  tier: number;
  step_group: string;
  step_order: number;
}

interface Group {
  name: string;
  description: string;
}

async function fetchData(): Promise<{ problems: Row[]; groups: Group[] }> {
  try {
    const admin = getSupabaseAdminClient();
    const [probRes, groupRes] = await Promise.all([
      admin
        .from("problems")
        .select("id, title, tier, step_group, step_order")
        .order("step_order", { ascending: true })
        .range(0, 999),
      admin
        .from("step_groups")
        .select("name, description, sort_order")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
    ]);
    return {
      problems: (probRes.data ?? []) as Row[],
      groups: (groupRes.data ?? []) as Group[],
    };
  } catch {
    return { problems: [], groups: [] };
  }
}

export default async function StepsPage() {
  const { problems, groups } = await fetchData();

  // Group problems by step_group.
  const byGroup = new Map<string, Row[]>();
  for (const p of problems) {
    const g = p.step_group || "기타";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(p);
  }
  for (const list of byGroup.values()) {
    list.sort((a, b) => a.step_order - b.step_order);
  }

  // Order by the managed step_groups table; only groups that have problems.
  const descOf = new Map(groups.map((g) => [g.name, g.description]));
  const orderedGroups = groups
    .map((g) => g.name)
    .filter((n) => byGroup.has(n));

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">단계별로 풀기</h1>
      </div>

      {orderedGroups.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          아직 단계 정보가 없습니다.
        </div>
      ) : (
        <div className="space-y-5">
          {orderedGroups.map((groupName, gi) => {
            const list = byGroup.get(groupName)!;
            const desc = descOf.get(groupName);
            return (
              <section key={groupName} className="card overflow-hidden">
                <div className="flex items-center gap-3 border-b border-surface-border bg-surface-dim px-5 py-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-accent font-mono text-xs font-bold text-white">
                    {gi + 1}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-ink">{groupName}</h2>
                    {desc && <p className="text-xs text-ink-faint">{desc}</p>}
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

