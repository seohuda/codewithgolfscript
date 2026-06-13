import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  const { error } = await admin
    .from("users")
    .update({ withdrawal_requested_at: new Date().toISOString() })
    .eq("id", session.userId);

  if (error) {
    return NextResponse.json({ error: "처리에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "탈퇴가 신청되었습니다. 7일 이내에 로그인하시면 탈퇴가 취소됩니다.",
  });
}

export async function DELETE(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  const { error } = await admin
    .from("users")
    .update({ withdrawal_requested_at: null })
    .eq("id", session.userId);

  if (error) {
    return NextResponse.json({ error: "처리에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "탈퇴 신청이 취소되었습니다." });
}
