import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { hashPassword, validatePassword } from "@/lib/auth";
import { hashToken } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/reset-password  { token, password }
export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = (body.token ?? "").trim();
  const password = body.password ?? "";
  if (!raw) {
    return NextResponse.json({ error: "토큰이 필요합니다." }, { status: 400 });
  }
  const passErr = validatePassword(password);
  if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });

  const admin = getSupabaseAdminClient();
  const hash = hashToken(raw);

  const { data: row } = await admin
    .from("auth_tokens")
    .select("id, user_id, type, expires_at, used")
    .eq("token_hash", hash)
    .eq("type", "reset_password")
    .maybeSingle();

  if (!row || row.used || new Date(row.expires_at as string) < new Date()) {
    return NextResponse.json(
      { error: "유효하지 않거나 만료된 링크입니다." },
      { status: 400 },
    );
  }

  await admin
    .from("users")
    .update({ password_hash: hashPassword(password) })
    .eq("id", row.user_id);
  await admin.from("auth_tokens").update({ used: true }).eq("id", row.id);

  return NextResponse.json({ ok: true });
}
