import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { normalizeEmail } from "@/lib/auth";
import { generateToken, RESET_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendPasswordResetEmail, siteUrl } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/forgot-password  { email }
// Always responds 200 to avoid leaking which emails are registered.
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const ok = NextResponse.json({ ok: true });
  if (!email) return ok;

  try {
    const admin = getSupabaseAdminClient();
    const { data: user } = await admin
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (user) {
      const { raw, hash } = generateToken();
      await admin.from("auth_tokens").insert({
        user_id: user.id,
        token_hash: hash,
        type: "reset_password",
        expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
      });
      const link = `${siteUrl()}/reset-password?token=${raw}`;
      await sendPasswordResetEmail(email, link);
      console.log(`[forgot-password] reset email sent to user ${user.id}`);
    } else {
      console.log(`[forgot-password] no account for the given email`);
    }
  } catch (e) {
    console.error("forgot-password failed:", e);
  }

  return ok;
}
