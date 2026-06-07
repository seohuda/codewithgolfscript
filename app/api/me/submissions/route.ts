import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// GET /api/me/submissions?page=1
// Returns the logged-in user's own submissions, including code.
export async function GET(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  try {
    const admin = getSupabaseAdminClient();

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: subs, error, count } = await admin
      .from("submissions")
      .select("id, problem_id, code, bytes, verdict, created_at", {
        count: "exact",
      })
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: "불러오지 못했습니다." }, { status: 500 });
    }

    const list = subs ?? [];

    // Join problem titles.
    const problemIds = [...new Set(list.map((s) => s.problem_id))];
    const titleMap = new Map<number, string>();
    if (problemIds.length > 0) {
      const { data: probs } = await admin
        .from("problems")
        .select("id, title")
        .in("id", problemIds);
      for (const p of probs ?? []) {
        titleMap.set(p.id as number, p.title as string);
      }
    }

    const submissions = list.map((s) => ({
      id: s.id,
      problemId: s.problem_id,
      problemTitle: titleMap.get(s.problem_id) ?? `#${s.problem_id}`,
      code: s.code,
      bytes: s.bytes,
      verdict: s.verdict,
      created_at: s.created_at,
    }));

    return NextResponse.json({
      submissions,
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "오류" },
      { status: 500 },
    );
  }
}
