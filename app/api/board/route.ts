import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/board?type=all|notice|normal  → list posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";

  try {
    const admin = getSupabaseAdminClient();
    let query = admin
      .from("board_posts")
      .select(
        "id, author, author_is_admin, title, is_notice, created_at, comment_count",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (type === "notice") query = query.eq("is_notice", true);
    else if (type === "normal") query = query.eq("is_notice", false);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message, posts: [] }, { status: 500 });
    }
    return NextResponse.json({ posts: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "오류", posts: [] },
      { status: 500 },
    );
  }
}

// POST /api/board  → create a post (notice requires admin)
export async function POST(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { title?: string; body?: string; isNotice?: boolean };
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

  // Verify admin status from DB before allowing a notice.
  let isNotice = false;
  if (body.isNotice) {
    const { data: u } = await admin
      .from("users")
      .select("is_admin")
      .eq("id", session.userId)
      .maybeSingle();
    if (!u?.is_admin) {
      return NextResponse.json(
        { error: "공지는 관리자만 작성할 수 있습니다." },
        { status: 403 },
      );
    }
    isNotice = true;
  }

  const { data, error } = await admin
    .from("posts")
    .insert({ user_id: session.userId, title, body: content, is_notice: isNotice })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: `작성 실패: ${error?.message ?? "알 수 없음"}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ id: data.id });
}
