import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/board/[id]  → post + comments
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ error: "잘못된 글 번호입니다." }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data: post, error: postErr } = await admin
      .from("board_posts")
      .select(
        "id, user_id, author, author_is_admin, title, body, is_notice, created_at, comment_count",
      )
      .eq("id", postId)
      .maybeSingle();

    if (postErr) {
      return NextResponse.json({ error: postErr.message }, { status: 500 });
    }
    if (!post) {
      return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: comments } = await admin
      .from("board_comments")
      .select("id, user_id, author, author_is_admin, body, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    return NextResponse.json({ post, comments: comments ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "오류" },
      { status: 500 },
    );
  }
}

// POST /api/board/[id]  → add comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ error: "잘못된 글 번호입니다." }, { status: 400 });
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
  const { error } = await admin
    .from("comments")
    .insert({ post_id: postId, user_id: session.userId, body: content });

  if (error) {
    return NextResponse.json(
      { error: "댓글 작성에 실패했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

// Returns true if the session user owns the post or is an admin.
async function canModify(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  postId: number,
  userId: string,
): Promise<{ ok: boolean; found: boolean }> {
  const { data: post } = await admin
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, found: false };
  if (post.user_id === userId) return { ok: true, found: true };

  const { data: u } = await admin
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return { ok: !!u?.is_admin, found: true };
}

// PATCH /api/board/[id]  → edit post (owner or admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ error: "잘못된 글 번호입니다." }, { status: 400 });
  }

  let body: { title?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const content = (body.body ?? "").trim();
  if (!title) return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  if (title.length > 200)
    return NextResponse.json({ error: "제목이 너무 깁니다." }, { status: 400 });
  if (content.length > 20000)
    return NextResponse.json({ error: "내용이 너무 깁니다." }, { status: 400 });

  const admin = getSupabaseAdminClient();
  const perm = await canModify(admin, postId, session.userId);
  if (!perm.found) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (!perm.ok) {
    return NextResponse.json(
      { error: "본인 글만 수정할 수 있습니다." },
      { status: 403 },
    );
  }

  const { error } = await admin
    .from("posts")
    .update({ title, body: content, updated_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) {
    return NextResponse.json(
      { error: "수정에 실패했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/board/[id]  → delete post (owner or admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ error: "잘못된 글 번호입니다." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const perm = await canModify(admin, postId, session.userId);
  if (!perm.found) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (!perm.ok) {
    return NextResponse.json(
      { error: "본인 글만 삭제할 수 있습니다." },
      { status: 403 },
    );
  }

  // Comments cascade-delete via FK.
  const { error } = await admin.from("posts").delete().eq("id", postId);
  if (error) {
    return NextResponse.json(
      { error: "삭제에 실패했습니다." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
