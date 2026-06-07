import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/stats — dashboard metrics for admins.
export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();

  // --- Top-line counts ------------------------------------------------
  const [usersRes, problemsRes, submissionsRes, postsRes, reportsRes] =
    await Promise.all([
      admin.from("users").select("id", { count: "exact", head: true }),
      admin.from("problems").select("id", { count: "exact", head: true }),
      admin.from("submissions").select("id", { count: "exact", head: true }),
      admin.from("posts").select("id", { count: "exact", head: true }),
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  const totalUsers = usersRes.count ?? 0;
  const totalProblems = problemsRes.count ?? 0;
  const totalSubmissions = submissionsRes.count ?? 0;
  const totalPosts = postsRes.count ?? 0;
  const openReports = reportsRes.count ?? 0;

  // --- Recent activity (last 7 days) ----------------------------------
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [newUsersRes, recentSubsRes] = await Promise.all([
    admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    admin
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
  ]);
  const newUsers7d = newUsersRes.count ?? 0;
  const submissions7d = recentSubsRes.count ?? 0;

  // --- Per-problem aggregates -----------------------------------------
  // Pull problem titles, then fold submissions into per-problem stats.
  const { data: problems } = await admin
    .from("problems")
    .select("id, title, tier")
    .range(0, 9999);
  const titleMap = new Map<number, { title: string; tier: number }>();
  for (const p of problems ?? []) {
    titleMap.set(p.id as number, {
      title: p.title as string,
      tier: (p.tier as number) ?? 0,
    });
  }

  const { data: subs } = await admin
    .from("submissions")
    .select("problem_id, user_id, verdict")
    .range(0, 199999);

  const stat = new Map<
    number,
    { solvers: Set<string>; ac: number; total: number }
  >();
  for (const s of subs ?? []) {
    const pid = s.problem_id as number;
    if (!stat.has(pid)) stat.set(pid, { solvers: new Set(), ac: 0, total: 0 });
    const st = stat.get(pid)!;
    st.total += 1;
    if (s.verdict === "AC") {
      st.ac += 1;
      st.solvers.add(s.user_id as string);
    }
  }

  const rows = [...stat.entries()].map(([pid, st]) => {
    const meta = titleMap.get(pid);
    return {
      id: pid,
      title: meta?.title ?? `#${pid}`,
      tier: meta?.tier ?? 0,
      solvers: st.solvers.size,
      attempts: st.total,
      acRate: st.total > 0 ? Math.round((st.ac / st.total) * 1000) / 10 : 0,
    };
  });

  // Most popular = most solvers.
  const popular = [...rows].sort((a, b) => b.solvers - a.solvers).slice(0, 10);

  // Hardest = lowest AC rate among problems with at least 5 attempts.
  const hardest = [...rows]
    .filter((r) => r.attempts >= 5)
    .sort((a, b) => a.acRate - b.acRate)
    .slice(0, 10);

  // Problems with zero solvers (and at least one attempt) — needs attention.
  const unsolved = rows
    .filter((r) => r.solvers === 0 && r.attempts > 0)
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 10);

  return NextResponse.json({
    totals: {
      users: totalUsers,
      problems: totalProblems,
      submissions: totalSubmissions,
      posts: totalPosts,
      openReports,
      newUsers7d,
      submissions7d,
    },
    popular,
    hardest,
    unsolved,
  });
}
