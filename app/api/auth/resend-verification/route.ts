import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  verifyPassword,
  normalizeEmail,
  escapeLike,
} from "@/lib/auth";
import { generateToken, VERIFY_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendVerificationEmail, siteUrl } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/resend-verification  { username, password }
// Re-sends the verification email for an unverified account. Requires
// the correct password so we don't leak which accounts exist or spam
// arbitrary inboxes.
export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json(
      { error: "아이디와 비밀번호를 입력해 주세요." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  const { data: user } = await admin
    .from("users")
    .select("id, password_hash, email, email_verified")
    .ilike("username", escapeLike(username))
    .maybeSingle();

  // Always return a generic success to avoid account enumeration.
  const generic = NextResponse.json({
    ok: true,
    message:
      "인증 메일을 다시 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요.",
  });

  if (!user || !user.password_hash) return generic;
  if (!verifyPassword(password, user.password_hash as string)) return generic;
  if (user.email_verified) {
    return NextResponse.json({
      ok: true,
      message: "이미 인증된 계정입니다. 로그인해 주세요.",
    });
  }

  const email = normalizeEmail((user.email as string) ?? "");
  if (!email) return generic;

  try {
    const { raw, hash } = generateToken();
    await admin.from("auth_tokens").insert({
      user_id: user.id,
      token_hash: hash,
      type: "verify_email",
      expires_at: new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString(),
    });
    const link = `${siteUrl()}/verify-email?token=${raw}`;
    await sendVerificationEmail(email, link);
  } catch (e) {
    console.error("resend verification failed:", e);
  }

  return generic;
}
