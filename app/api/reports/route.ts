import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reports  { target_type: 'post'|'comment', target_id, reason }
export async function POST(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { target_type?: string; target_id?: number; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const type = body.target_type;
  const targetId = Number(body.target_id);
  const reason = (body.reason ?? "").trim().slice(0, 1000);
  if (type !== "post" && type !== "comment") {
    return NextResponse.json({ error: "잘못된 신고 대상입니다." }, { status: 400 });
  }
  if (!Number.isFinite(targetId)) {
    return NextResponse.json({ error: "잘못된 대상 ID." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  // Avoid duplicate open reports from the same user on the same target.
  const { data: dup } = await admin
    .from("reports")
    .select("id")
    .eq("reporter_id", session.userId)
    .eq("target_type", type)
    .eq("target_id", targetId)
    .eq("status", "open")
    .maybeSingle();
  if (dup) {
    return NextResponse.json({ ok: true, already: true });
  }

  const { error } = await admin.from("reports").insert({
    reporter_id: session.userId,
    target_type: type,
    target_id: targetId,
    reason,
  });
  if (error) {
    return NextResponse.json({ error: "신고 접수에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
