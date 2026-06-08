import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  hashPassword,
  validateUsername,
  validatePassword,
  validateEmail,
  normalizeEmail,
  escapeLike,
} from "@/lib/auth";
import { generateToken, VERIFY_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendVerificationEmail, siteUrl } from "@/lib/email";
import { getClientIp } from "@/lib/ip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Maximum accounts allowed from a single source IP.
const MAX_ACCOUNTS_PER_IP = 3;

// Creates a verification token row and emails the link.
// Returns true on success, false if the email could not be sent.
async function issueVerification(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  userId: string,
  email: string,
): Promise<boolean> {
  try {
    const { raw, hash } = generateToken();
    await admin.from("auth_tokens").insert({
      user_id: userId,
      token_hash: hash,
      type: "verify_email",
      expires_at: new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString(),
    });
    const link = `${siteUrl()}/verify-email?token=${raw}`;
    await sendVerificationEmail(email, link);
    return true;
  } catch (e) {
    console.error("verification email failed:", e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  const email = normalizeEmail(body.email ?? "");

  const userErr = validateUsername(username);
  if (userErr) return NextResponse.json({ error: userErr }, { status: 400 });

  const emailErr = validateEmail(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  const passErr = validatePassword(password);
  if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });

  const admin = getSupabaseAdminClient();

  // --- Per-IP account limit ------------------------------------------
  const ip = getClientIp(req);
  if (ip) {
    const { count } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("signup_ip", ip);
    if ((count ?? 0) >= MAX_ACCOUNTS_PER_IP) {
      return NextResponse.json(
        {
          error: `이 네트워크에서 만들 수 있는 계정 수(${MAX_ACCOUNTS_PER_IP}개)를 초과했습니다.`,
        },
        { status: 429 },
      );
    }
  }

  // Reject if the email is already taken.
  const { data: emailTaken } = await admin
    .from("users")
    .select("id")
    .ilike("email", escapeLike(email))
    .maybeSingle();
  if (emailTaken) {
    return NextResponse.json(
      { error: "이미 사용 중인 이메일입니다." },
      { status: 409 },
    );
  }

  // Check for an existing account (case-insensitive username).
  const { data: existing, error: selErr } = await admin
    .from("users")
    .select("id, username, password_hash")
    .ilike("username", escapeLike(username))
    .maybeSingle();

  if (selErr) {
    return NextResponse.json(
      { error: "데이터베이스 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  if (existing) {
    // Legacy seed user with no password: claim it.
    if (existing.password_hash) {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디입니다." },
        { status: 409 },
      );
    }
    const { error: updErr } = await admin
      .from("users")
      .update({
        password_hash: hashPassword(password),
        email,
        email_verified: false,
        signup_ip: ip || null,
      })
      .eq("id", existing.id);

    if (updErr) {
      return NextResponse.json(
        { error: "계정 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    const emailSent = await issueVerification(
      admin,
      existing.id as string,
      email,
    );
    return NextResponse.json({
      ok: true,
      verificationRequired: true,
      emailSent,
      email,
    });
  }

  // Create a brand-new user.
  const { data: created, error: insErr } = await admin
    .from("users")
    .insert({
      username,
      password_hash: hashPassword(password),
      email,
      email_verified: false,
      signup_ip: ip || null,
    })
    .select("id, username")
    .single();

  if (insErr || !created) {
    if (insErr?.code === "23505") {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디 또는 이메일입니다." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "계정 생성에 실패했습니다." },
      { status: 500 },
    );
  }

  const emailSent = await issueVerification(
    admin,
    created.id as string,
    email,
  );

  return NextResponse.json({
    ok: true,
    verificationRequired: true,
    emailSent,
    email,
  });
}
