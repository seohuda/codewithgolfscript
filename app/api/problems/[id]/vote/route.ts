import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Minimum number of votes before the average is shown / reflected.
const MIN_VOTES = 3;

// GET /api/problems/[id]/vote — vote summary + my vote
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const problemId = Number(params.id);
  if (!Number.isFinite(problemId)) {
    return NextResponse.json({ error: "잘못된 ID." }, { status: 400 });
  }
  const admin = getSupabaseAdminClient();
  const { data: votes } = await admin
    .from("difficulty_votes")
    .select("tier, user_id")
    .eq("problem_id", problemId)
    .range(0, 99999);

  const list = votes ?? [];
  const count = list.length;
  const avg =
    count >= MIN_VOTES
      ? Math.round(list.reduce((a, v) => a + (v.tier as number), 0) / count)
      : null;

  let myVote: number | null = null;
  let canVote = false;
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    const mine = list.find((v) => v.user_id === session.userId);
    myVote = mine ? (mine.tier as number) : null;
    // Only users who solved (AC) this problem may vote.
    const { data: ac } = await admin
      .from("submissions")
      .select("id")
      .eq("user_id", session.userId)
      .eq("problem_id", problemId)
      .eq("verdict", "AC")
      .limit(1)
      .maybeSingle();
    canVote = !!ac;
  }

  return NextResponse.json({ count, avg, myVote, canVote, minVotes: MIN_VOTES });
}

// POST /api/problems/[id]/vote  { tier }  — cast/update my difficulty vote
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const problemId = Number(params.id);
  if (!Number.isFinite(problemId)) {
    return NextResponse.json({ error: "잘못된 ID." }, { status: 400 });
  }
  let body: { tier?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const tier = Number(body.tier);
  if (!Number.isFinite(tier) || tier < 1 || tier > 30) {
    return NextResponse.json({ error: "1~30 사이 티어를 선택해 주세요." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  // Only users who have solved (AC) this problem may vote on its difficulty.
  const { data: ac } = await admin
    .from("submissions")
    .select("id")
    .eq("user_id", session.userId)
    .eq("problem_id", problemId)
    .eq("verdict", "AC")
    .limit(1)
    .maybeSingle();
  if (!ac) {
    return NextResponse.json(
      { error: "문제를 푼 사람만 난이도를 투표할 수 있습니다." },
      { status: 403 },
    );
  }

  const { error } = await admin
    .from("difficulty_votes")
    .upsert(
      { user_id: session.userId, problem_id: problemId, tier },
      { onConflict: "user_id,problem_id" },
    );
  if (error) {
    return NextResponse.json({ error: "투표에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
