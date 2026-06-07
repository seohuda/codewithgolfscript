import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/step-groups — list (admin)
export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("step_groups")
    .select("id, name, description, sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) {
    return NextResponse.json({ error: "불러오지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ groups: data ?? [] });
}

// POST /api/admin/step-groups — create
export async function POST(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  let body: { name?: string; description?: string; sort_order?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "단계 이름을 입력해 주세요." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("step_groups").insert({
    name,
    description: (body.description ?? "").trim(),
    sort_order: Number(body.sort_order) || 0,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 있는 단계 이름입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: "생성에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
