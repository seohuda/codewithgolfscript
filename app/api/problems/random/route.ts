import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/problems/random?unsolvedOnly=1
// Returns a random problem id. When logged in and unsolvedOnly is set,
// prefers problems the user hasn't solved yet.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unsolvedOnly = searchParams.get("unsolvedOnly") === "1";

  try {
    const admin = getSupabaseAdminClient();

    // All problem ids.
    const { data: probs } = await admin
      .from("problems")
      .select("id")
      .range(0, 9999);
    let ids = (probs ?? []).map((p) => p.id as number);
    if (ids.length === 0) {
      return NextResponse.json({ error: "문제가 없습니다." }, { status: 404 });
    }

    // Optionally exclude solved problems for the logged-in user.
    if (unsolvedOnly) {
      const session = verifySessionToken(
        req.cookies.get(SESSION_COOKIE)?.value,
      );
      if (session) {
        const { data: subs } = await admin
          .from("submissions")
          .select("problem_id")
          .eq("user_id", session.userId)
          .eq("verdict", "AC")
          .range(0, 99999);
        const solved = new Set((subs ?? []).map((s) => s.problem_id as number));
        const unsolved = ids.filter((id) => !solved.has(id));
        if (unsolved.length > 0) ids = unsolved; // fall back to all if none left
      }
    }

    const id = ids[Math.floor(Math.random() * ids.length)];
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "오류" },
      { status: 500 },
    );
  }
}
