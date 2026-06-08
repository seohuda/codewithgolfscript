import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { rateUser } from "@/lib/score";
import { computeBadges } from "@/lib/badges";
import { kstDayKey } from "@/lib/date";
import { verifySessionToken, SESSION_COOKIE, escapeLike } from "@/lib/auth";

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
  req: NextRequest,
  { params }: { params: { username: string } },
) {
  let username = "";
  try {
    username = decodeURIComponent(params.username ?? "").trim();
  } catch {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!username || username.length > 64) {
    return NextResponse.json({ error: "사용자명이 필요합니다." }, { status: 400 });
  }
  // Usernames are restricted to [A-Za-z0-9_]; reject anything else so the
  // ilike lookup can never receive % or other wildcard/meta characters.
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }
  const safeName = username;

  try {
    const admin = getSupabaseAdminClient();

    const { data: user, error: userErr } = await admin
      .from("users")
      .select("id, username, created_at, is_admin, bio, featured_badge")
      .ilike("username", escapeLike(safeName))
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
      .select("problem_id, bytes, verdict, score, max_score, created_at")
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
    // Bucketed by KST so the graph and streaks line up with the user's
    // local day.
    const dayCounts: Record<string, number> = {};
    for (const s of submissions) {
      const day = kstDayKey(s.created_at as string);
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
    const groupCounts: Record<string, number> = {};
    if (solvedIds.length > 0) {
      const { data: probs } = await admin
        .from("problems")
        .select("id, title, tier, step_group")
        .in("id", solvedIds);
      solvedProblems = (probs ?? [])
        .map((p) => ({
          id: p.id as number,
          title: p.title as string,
          tier: (p.tier as number) ?? 0,
          bytes: bestByProblem.get(p.id as number) ?? 0,
        }))
        .sort((a, b) => b.tier - a.tier || a.title.localeCompare(b.title));
      for (const p of probs ?? []) {
        const g = (p.step_group as string) || "";
        if (g) groupCounts[g] = (groupCounts[g] ?? 0) + 1;
      }
    }

    const rating = rateUser(solvedProblems.map((p) => p.tier));

    // Partial-score problems: best score > 0 but not fully solved (no AC).
    // Track the highest score achieved per problem from subtask scoring.
    const bestScore = new Map<number, { score: number; max: number }>();
    for (const s of submissions) {
      if (s.score == null || s.max_score == null) continue;
      const cur = bestScore.get(s.problem_id);
      if (!cur || (s.score as number) > cur.score) {
        bestScore.set(s.problem_id, {
          score: s.score as number,
          max: s.max_score as number,
        });
      }
    }
    const partialIds = [...bestScore.entries()]
      .filter(
        ([pid, v]) =>
          v.score > 0 && v.score < v.max && !bestByProblem.has(pid),
      )
      .map(([pid]) => pid);

    let partialProblems: {
      id: number;
      title: string;
      tier: number;
      score: number;
      maxScore: number;
    }[] = [];
    if (partialIds.length > 0) {
      const { data: pprobs } = await admin
        .from("problems")
        .select("id, title, tier")
        .in("id", partialIds);
      partialProblems = (pprobs ?? [])
        .map((p) => {
          const v = bestScore.get(p.id as number)!;
          return {
            id: p.id as number,
            title: p.title as string,
            tier: (p.tier as number) ?? 0,
            score: v.score,
            maxScore: v.max,
          };
        })
        .sort((a, b) => b.tier - a.tier || a.title.localeCompare(b.title));
    }

    // Badge inputs.
    const minBytes = solvedProblems.length
      ? Math.min(...solvedProblems.map((p) => p.bytes))
      : null;
    const maxTier = solvedProblems.length
      ? Math.max(...solvedProblems.map((p) => p.tier))
      : 0;
    const activeDays = Object.keys(dayCounts).length;
    const badges = computeBadges({
      solvedCount: bestByProblem.size,
      acSubmissions,
      minBytes,
      maxTier,
      activeDays,
      groupCounts,
    });

    // Follow counts and the viewer's relationship to this profile.
    const [followersRes, followingRes] = await Promise.all([
      admin
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", user.id),
      admin
        .from("follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", user.id),
    ]);
    const followers = followersRes.count ?? 0;
    const following = followingRes.count ?? 0;

    let isFollowing = false;
    let isMe = false;
    const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (session) {
      isMe = session.userId === user.id;
      if (!isMe) {
        const { data: rel } = await admin
          .from("follows")
          .select("follower_id")
          .eq("follower_id", session.userId)
          .eq("following_id", user.id)
          .maybeSingle();
        isFollowing = !!rel;
      }
    }

    return NextResponse.json({
      user: {
        username: user.username,
        created_at: user.created_at,
        is_admin: user.is_admin,
        bio: user.bio ?? "",
        featured_badge: user.featured_badge ?? null,
        followers,
        following,
        isFollowing,
        isMe,
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
      partialProblems,
      activity: dayCounts,
      badges,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "오류" },
      { status: 500 },
    );
  }
}
