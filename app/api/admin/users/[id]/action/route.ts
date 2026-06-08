import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/users/[id]/action  { action: 'suspend'|'unsuspend'|'delete', reason? }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let body: { action?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const action = body.action;
  const userId = params.id;

  const admin = getSupabaseAdminClient();
  const { data: target } = await admin
    .from("users")
    .select("id, username, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  // Never let an admin suspend or delete another admin via this tool.
  if (target.is_admin) {
    return NextResponse.json(
      { error: "관리자 계정에는 이 작업을 할 수 없습니다." },
      { status: 400 },
    );
  }

  if (action === "suspend") {
    const reason = (body.reason ?? "").trim().slice(0, 500);
    await admin
      .from("users")
      .update({
        suspended: true,
        suspended_reason: reason,
        suspended_at: new Date().toISOString(),
      })
      .eq("id", userId);
    await logAdminAction({
      adminId,
      action: "suspend_user",
      targetType: "user",
      targetId: userId,
      detail: `${target.username} 정지${reason ? ` (사유: ${reason})` : ""}`,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "unsuspend") {
    await admin
      .from("users")
      .update({
        suspended: false,
        suspended_reason: null,
        suspended_at: null,
      })
      .eq("id", userId);
    await logAdminAction({
      adminId,
      action: "unsuspend_user",
      targetType: "user",
      targetId: userId,
      detail: `${target.username} 정지 해제`,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    // submissions / auth_tokens / votes / reports cascade via FK.
    const { error } = await admin.from("users").delete().eq("id", userId);
    if (error) {
      return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
    }
    await logAdminAction({
      adminId,
      action: "delete_user",
      targetType: "user",
      targetId: userId,
      detail: `${target.username} 계정 삭제`,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "알 수 없는 작업입니다." }, { status: 400 });
}
