import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

// GET /api/admin/audit?page=1 — recent admin actions (monitoring log).
export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const admin = getSupabaseAdminClient();
  const from = (page - 1) * PAGE_SIZE;

  const { data: logs, error, count } = await admin
    .from("admin_audit_log")
    .select("id, admin_id, action, target_type, target_id, detail, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    return NextResponse.json({ error: "불러오지 못했습니다." }, { status: 500 });
  }

  // Resolve admin usernames.
  const adminIds = [...new Set((logs ?? []).map((l) => l.admin_id as string))];
  const nameMap = new Map<string, string>();
  if (adminIds.length > 0) {
    const { data: admins } = await admin
      .from("users")
      .select("id, username")
      .in("id", adminIds);
    for (const a of admins ?? []) {
      nameMap.set(a.id as string, a.username as string);
    }
  }

  const entries = (logs ?? []).map((l) => ({
    id: l.id,
    adminName: nameMap.get(l.admin_id as string) ?? "(알 수 없음)",
    action: l.action,
    targetType: l.target_type,
    targetId: l.target_id,
    detail: l.detail,
    created_at: l.created_at,
  }));

  return NextResponse.json({
    entries,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}
