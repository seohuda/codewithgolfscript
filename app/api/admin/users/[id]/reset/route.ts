import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/audit";
import { generateToken, RESET_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendPasswordResetEmail, siteUrl } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/users/[id]/reset
// Admin-triggered password reset: emails the user a reset link and
// clears any login lockout. Useful for helping locked-out users.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  const { data: user } = await admin
    .from("users")
    .select("id, username, email")
    .eq("id", params.id)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!user.email) {
    return NextResponse.json(
      { error: "이 계정에는 등록된 이메일이 없어 재설정 메일을 보낼 수 없습니다." },
      { status: 400 },
    );
  }

  // Clear any lockout so the user can log in once they reset.
  await admin
    .from("users")
    .update({ failed_login_count: 0, lockout_until: null })
    .eq("id", user.id);

  let emailSent = true;
  try {
    const { raw, hash } = generateToken();
    await admin.from("auth_tokens").insert({
      user_id: user.id,
      token_hash: hash,
      type: "reset_password",
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    });
    const link = `${siteUrl()}/reset-password?token=${raw}`;
    await sendPasswordResetEmail(user.email as string, link);
  } catch (e) {
    console.error("admin reset email failed:", e);
    emailSent = false;
  }

  await logAdminAction({
    adminId,
    action: "send_password_reset",
    targetType: "user",
    targetId: user.id as string,
    detail: `${user.username} 비밀번호 재설정 메일 발송 (${emailSent ? "성공" : "실패"})`,
  });

  return NextResponse.json({ ok: true, emailSent });
}
