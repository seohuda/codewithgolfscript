import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { rateUser } from "@/lib/score";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RankingEntry {
  username: string;
  score: number;
  tier: number;
  solvedCount: number;
}

// GET /api/ranking — users ranked by total score (admins excluded).
export async function GET() {
  try {
    const admin = getSupabaseAdminClient();

    // Non-admin users.
    const { data: users, error: uErr } = await admin
      .from("users")
      .select("id, username, is_admin")
      .eq("is_admin", false)
      .range(0, 9999);

    if (uErr) {
      return NextResponse.json({ error: uErr.message, ranking: [] }, { status: 500 });
    }

    // All AC submissions joined with problem tiers.
    const { data: subs, error: sErr } = await admin
      .from("submissions")
      .select("user_id, problem_id, verdict")
      .eq("verdict", "AC")
      .range(0, 99999);

    if (sErr) {
      return NextResponse.json({ error: sErr.message, ranking: [] }, { status: 500 });
    }

    const { data: probs } = await admin
      .from("problems")
      .select("id, tier")
      .range(0, 9999);
    const tierOf = new Map<number, number>();
    for (const p of probs ?? []) tierOf.set(p.id as number, (p.tier as number) ?? 0);

    // distinct solved problems per user
    const solvedByUser = new Map<string, Set<number>>();
    for (const s of subs ?? []) {
      const uid = s.user_id as string;
      if (!solvedByUser.has(uid)) solvedByUser.set(uid, new Set());
      solvedByUser.get(uid)!.add(s.problem_id as number);
    }

    const ranking: RankingEntry[] = (users ?? [])
      .map((u) => {
        const solved = solvedByUser.get(u.id as string) ?? new Set<number>();
        const tiers = [...solved].map((pid) => tierOf.get(pid) ?? 0);
        const r = rateUser(tiers);
        return {
          username: u.username as string,
          score: r.score,
          tier: r.tier,
          solvedCount: solved.size,
        };
      })
      .filter((e) => e.solvedCount > 0)
      .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));

    return NextResponse.json({ ranking });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "오류", ranking: [] },
      { status: 500 },
    );
  }
}
