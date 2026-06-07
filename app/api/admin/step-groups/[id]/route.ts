import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/step-groups/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "잘못된 ID." }, { status: 400 });
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

  // Keep problems' step_group label in sync when the name changes.
  const { data: prev } = await admin
    .from("step_groups")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin
    .from("step_groups")
    .update({
      name,
      description: (body.description ?? "").trim(),
      sort_order: Number(body.sort_order) || 0,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 있는 단계 이름입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }

  if (prev?.name && prev.name !== name) {
    await admin
      .from("problems")
      .update({ step_group: name })
      .eq("step_group", prev.name);
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/step-groups/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "잘못된 ID." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  // Detach problems from this group (set step_group to empty).
  const { data: grp } = await admin
    .from("step_groups")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (grp?.name) {
    await admin
      .from("problems")
      .update({ step_group: "" })
      .eq("step_group", grp.name);
  }

  const { error } = await admin.from("step_groups").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
