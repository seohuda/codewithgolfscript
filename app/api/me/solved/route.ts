import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/me/solved — the logged-in user's solved / tried problem ids.
export async function GET(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ solved: [], tried: [] });
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("submissions")
      .select("problem_id, verdict")
      .eq("user_id", session.userId)
      .range(0, 99999);

    if (error) {
      return NextResponse.json({ solved: [], tried: [] }, { status: 500 });
    }

    const solvedSet = new Set<number>();
    const triedSet = new Set<number>();
    for (const s of data ?? []) {
      if (s.verdict === "AC") solvedSet.add(s.problem_id as number);
      else triedSet.add(s.problem_id as number);
    }
    // A solved problem is not also "tried" (solved wins).
    for (const id of solvedSet) triedSet.delete(id);

    return NextResponse.json({
      solved: [...solvedSet],
      tried: [...triedSet],
    });
  } catch {
    return NextResponse.json({ solved: [], tried: [] }, { status: 500 });
  }
}
