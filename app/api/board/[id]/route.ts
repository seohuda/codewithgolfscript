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
      .select("id, author, title, body, created_at, comment_count")
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
      .select("id, author, body, created_at")
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
      { error: `댓글 작성 실패: ${error.message}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
