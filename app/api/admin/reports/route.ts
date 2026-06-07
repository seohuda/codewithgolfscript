import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/reports?status=open — list reports with target preview
export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "open";

  const admin = getSupabaseAdminClient();
  let q = admin
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, status, created_at")
    .order("created_at", { ascending: false })
    .range(0, 200);
  if (status !== "all") q = q.eq("status", status);
  const { data: reports, error } = await q;
  if (error) {
    return NextResponse.json({ error: "불러오지 못했습니다." }, { status: 500 });
  }

  // Attach a short preview of each target.
  const out = [];
  for (const r of reports ?? []) {
    let preview = "";
    let postId: number | null = null;
    if (r.target_type === "post") {
      const { data } = await admin
        .from("posts")
        .select("title, body")
        .eq("id", r.target_id)
        .maybeSingle();
      preview = data ? `${data.title} — ${(data.body ?? "").slice(0, 80)}` : "(삭제됨)";
      postId = data ? (r.target_id as number) : null;
    } else {
      const { data } = await admin
        .from("comments")
        .select("body, post_id")
        .eq("id", r.target_id)
        .maybeSingle();
      preview = data ? (data.body ?? "").slice(0, 100) : "(삭제됨)";
      postId = data ? (data.post_id as number) : null;
    }
    out.push({ ...r, preview, postId });
  }

  return NextResponse.json({ reports: out });
}

// POST /api/admin/reports  { id, action: 'resolve'|'dismiss'|'delete_target' }
export async function POST(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  let body: { id?: number; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "잘못된 ID." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  if (body.action === "delete_target") {
    const { data: r } = await admin
      .from("reports")
      .select("target_type, target_id")
      .eq("id", id)
      .maybeSingle();
    if (r) {
      const table = r.target_type === "post" ? "posts" : "comments";
      await admin.from(table).delete().eq("id", r.target_id);
      await logAdminAction({
        adminId,
        action: "delete_report_target",
        targetType: r.target_type as string,
        targetId: r.target_id as number,
        detail: `신고 #${id} 처리: ${r.target_type} #${r.target_id} 삭제`,
      });
    }
    await admin.from("reports").update({ status: "resolved" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  const status = body.action === "dismiss" ? "dismissed" : "resolved";
  await admin.from("reports").update({ status }).eq("id", id);
  return NextResponse.json({ ok: true });
}
