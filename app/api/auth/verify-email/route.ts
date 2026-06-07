import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { hashToken } from "@/lib/tokens";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/verify-email  { token }
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = (body.token ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "토큰이 필요합니다." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const hash = hashToken(raw);

  const { data: row } = await admin
    .from("auth_tokens")
    .select("id, user_id, type, expires_at, used")
    .eq("token_hash", hash)
    .eq("type", "verify_email")
    .maybeSingle();

  if (!row || row.used || new Date(row.expires_at as string) < new Date()) {
    return NextResponse.json(
      { error: "유효하지 않거나 만료된 링크입니다." },
      { status: 400 },
    );
  }

  await admin
    .from("users")
    .update({ email_verified: true })
    .eq("id", row.user_id);
  await admin.from("auth_tokens").update({ used: true }).eq("id", row.id);

  // Log the user in immediately after a successful verification.
  const { data: u } = await admin
    .from("users")
    .select("id, username")
    .eq("id", row.user_id)
    .maybeSingle();

  const res = NextResponse.json({
    ok: true,
    user: u ? { id: u.id, username: u.username } : undefined,
  });
  if (u) {
    const token = createSessionToken({
      userId: u.id as string,
      username: u.username as string,
    });
    res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  }
  return res;
}
