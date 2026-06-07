import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { validateUsername } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth/check-username?username=foo
// Returns { available: boolean, error?: string }.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") ?? "").trim();

  const err = validateUsername(username);
  if (err) {
    return NextResponse.json({ available: false, error: err });
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .select("id, password_hash")
      .ilike("username", username)
      .maybeSingle();

    // A legacy seed user with no password is still claimable.
    const taken = !!data && !!data.password_hash;
    return NextResponse.json({
      available: !taken,
      error: taken ? "이미 사용 중인 아이디입니다." : undefined,
    });
  } catch {
    return NextResponse.json(
      { available: false, error: "확인 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
