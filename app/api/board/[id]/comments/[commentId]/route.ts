import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns true if the session user owns the comment or is an admin.
async function canModify(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  commentId: number,
  userId: string,
): Promise<{ ok: boolean; found: boolean }> {
  const { data: c } = await admin
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!c) return { ok: false, found: false };
  if (c.user_id === userId) return { ok: true, found: true };

  const { data: u } = await admin
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return { ok: !!u?.is_admin, found: true };
}

// PATCH /api/board/[id]/comments/[commentId] — edit (owner or admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } },
) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const commentId = Number(params.commentId);
  if (!Number.isFinite(commentId)) {
    return NextResponse.json({ error: "잘못된 댓글입니다." }, { status: 400 });
  }

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const content = (body.body ?? "").trim();
  if (!content) return NextResponse.json({ error: "댓글을 입력해 주세요." }, { status: 400 });
  if (content.length > 5000)
    return NextResponse.json({ error: "댓글이 너무 깁니다." }, { status: 400 });

  const admin = getSupabaseAdminClient();
  const perm = await canModify(admin, commentId, session.userId);
  if (!perm.found)
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  if (!perm.ok)
    return NextResponse.json(
      { error: "본인 댓글만 수정할 수 있습니다." },
      { status: 403 },
    );

  const { error } = await admin
    .from("comments")
    .update({ body: content })
    .eq("id", commentId);
  if (error) {
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/board/[id]/comments/[commentId] — delete (owner or admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } },
) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const commentId = Number(params.commentId);
  if (!Number.isFinite(commentId)) {
    return NextResponse.json({ error: "잘못된 댓글입니다." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const perm = await canModify(admin, commentId, session.userId);
  if (!perm.found)
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  if (!perm.ok)
    return NextResponse.json(
      { error: "본인 댓글만 삭제할 수 있습니다." },
      { status: 403 },
    );

  const { error } = await admin.from("comments").delete().eq("id", commentId);
  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
