import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  escapeLike,
} from "@/lib/auth";
import { generateToken, RESET_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendPasswordResetEmail, siteUrl } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

// Sends a password-reset email when an account gets locked. Best-effort.
async function sendLockoutReset(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  userId: string,
  email: string | null,
) {
  if (!email) return;
  try {
    const { raw, hash } = generateToken();
    await admin.from("auth_tokens").insert({
      user_id: userId,
      token_hash: hash,
      type: "reset_password",
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    });
    const link = `${siteUrl()}/reset-password?token=${raw}`;
    await sendPasswordResetEmail(email, link);
  } catch (e) {
    console.error("lockout reset email failed:", e);
  }
}

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

  const { data: user, error } = await admin
    .from("users")
    .select(
      "id, username, password_hash, is_admin, email_verified, email, failed_login_count, lockout_until, suspended, suspended_reason",
    )
    .ilike("username", escapeLike(username))
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "데이터베이스 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  // Generic message to avoid revealing whether the account exists.
  const invalid = NextResponse.json(
    { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
    { status: 401 },
  );

  if (!user || !user.password_hash) return invalid;

  // Account currently locked? (Checked before password verification so a
  // locked account stays locked even with the right password.)
  if (user.lockout_until && new Date(user.lockout_until as string) > new Date()) {
    const mins = Math.ceil(
      (new Date(user.lockout_until as string).getTime() - Date.now()) / 60000,
    );
    return NextResponse.json(
      {
        error: `비밀번호를 여러 번 틀려 계정이 잠겼습니다. 가입한 이메일로 비밀번호 재설정 링크를 보냈습니다. (${mins}분 후 다시 시도 가능)`,
        locked: true,
      },
      { status: 423 },
    );
  }

  // Wrong password → increment the failure counter, lock at the limit.
  if (!verifyPassword(password, user.password_hash as string)) {
    const prev = (user.failed_login_count as number) ?? 0;
    const next = prev + 1;

    if (next >= MAX_ATTEMPTS) {
      await admin
        .from("users")
        .update({
          failed_login_count: next,
          lockout_until: new Date(Date.now() + LOCKOUT_MS).toISOString(),
        })
        .eq("id", user.id);
      await sendLockoutReset(
        admin,
        user.id as string,
        (user.email as string) ?? null,
      );
      return NextResponse.json(
        {
          error:
            "비밀번호를 5회 틀려 계정이 잠겼습니다. 가입한 이메일로 비밀번호 재설정 링크를 보냈습니다.",
          locked: true,
        },
        { status: 423 },
      );
    }

    await admin
      .from("users")
      .update({ failed_login_count: next })
      .eq("id", user.id);
    const remaining = MAX_ATTEMPTS - next;
    return NextResponse.json(
      {
        error: `아이디 또는 비밀번호가 올바르지 않습니다. (남은 시도 ${remaining}회)`,
      },
      { status: 401 },
    );
  }

  // --- Password is correct from here on -------------------------------

  // Admin-suspended accounts cannot log in. Checked AFTER password
  // verification so the suspended state is not an enumeration oracle.
  if (user.suspended) {
    return NextResponse.json(
      {
        error: user.suspended_reason
          ? `정지된 계정입니다: ${user.suspended_reason}`
          : "정지된 계정입니다. 관리자에게 문의하세요.",
        suspended: true,
      },
      { status: 403 },
    );
  }

  // Email verification is required before logging in.
  if (!user.email_verified) {
    // Correct password but unverified: still clear the failure counter so
    // earlier wrong attempts don't accumulate toward a lockout.
    if ((user.failed_login_count as number) > 0) {
      await admin
        .from("users")
        .update({ failed_login_count: 0, lockout_until: null })
        .eq("id", user.id);
    }
    return NextResponse.json(
      {
        error: "이메일 인증이 필요합니다. 가입 시 받은 인증 메일을 확인해 주세요.",
        verificationRequired: true,
      },
      { status: 403 },
    );
  }

  // Successful login → reset the failure counter and any lockout.
  // Also cancel any pending withdrawal request.
  if ((user.failed_login_count as number) > 0 || user.lockout_until) {
    await admin
      .from("users")
      .update({ failed_login_count: 0, lockout_until: null, withdrawal_requested_at: null })
      .eq("id", user.id);
  } else {
    await admin
      .from("users")
      .update({ withdrawal_requested_at: null })
      .eq("id", user.id);
  }

  const token = createSessionToken({
    userId: user.id as string,
    username: user.username as string,
  });
  const res = NextResponse.json({
    user: { id: user.id, username: user.username, isAdmin: !!user.is_admin },
  });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
