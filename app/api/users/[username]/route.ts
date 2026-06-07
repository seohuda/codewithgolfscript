import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { rateUser } from "@/lib/score";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SolvedProblem {
  id: number;
  title: string;
  tier: number;
  bytes: number;
}

// GET /api/users/[username]
export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } },
) {
  const username = decodeURIComponent(params.username ?? "").trim();
  if (!username) {
    return NextResponse.json({ error: "사용자명이 필요합니다." }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdminClient();

    const { data: user, error: userErr } = await admin
      .from("users")
      .select("id, username, created_at, is_admin")
      .ilike("username", username)
      .maybeSingle();

    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // All submissions for this user.
    const { data: subs, error: subErr } = await admin
      .from("submissions")
      .select("problem_id, bytes, verdict, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(0, 9999);

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const submissions = subs ?? [];
    const totalSubmissions = submissions.length;
    const acSubmissions = submissions.filter((s) => s.verdict === "AC").length;
    const acceptanceRate =
      totalSubmissions > 0
        ? Math.round((acSubmissions / totalSubmissions) * 1000) / 10
        : 0;

    // Verdict breakdown.
    const verdictCounts: Record<string, number> = {};
    for (const s of submissions) {
      verdictCounts[s.verdict] = (verdictCounts[s.verdict] ?? 0) + 1;
    }

    // Daily submission counts for the last ~17 weeks (activity graph).
    const dayCounts: Record<string, number> = {};
    for (const s of submissions) {
      const day = new Date(s.created_at as string)
        .toISOString()
        .slice(0, 10);
      dayCounts[day] = (dayCounts[day] ?? 0) + 1;
    }

    // Distinct solved problems with best (smallest) bytes.
    const bestByProblem = new Map<number, number>();
    for (const s of submissions) {
      if (s.verdict !== "AC") continue;
      const cur = bestByProblem.get(s.problem_id);
      if (cur === undefined || s.bytes < cur) {
        bestByProblem.set(s.problem_id, s.bytes);
      }
    }

    const solvedIds = [...bestByProblem.keys()];
    let solvedProblems: SolvedProblem[] = [];
    if (solvedIds.length > 0) {
      const { data: probs } = await admin
        .from("problems")
        .select("id, title, tier")
        .in("id", solvedIds);
      solvedProblems = (probs ?? [])
        .map((p) => ({
          id: p.id as number,
          title: p.title as string,
          tier: (p.tier as number) ?? 0,
          bytes: bestByProblem.get(p.id as number) ?? 0,
        }))
        .sort((a, b) => b.tier - a.tier || a.title.localeCompare(b.title));
    }

    const rating = rateUser(solvedProblems.map((p) => p.tier));

    return NextResponse.json({
      user: {
        username: user.username,
        created_at: user.created_at,
        is_admin: user.is_admin,
      },
      stats: {
        totalSubmissions,
        acSubmissions,
        solvedCount: bestByProblem.size,
        acceptanceRate,
        totalBytes: solvedProblems.reduce((acc, p) => acc + p.bytes, 0),
        verdictCounts,
        score: rating.score,
        userTier: rating.tier,
      },
      solvedProblems,
      activity: dayCounts,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "오류" },
      { status: 500 },
    );
  }
}
