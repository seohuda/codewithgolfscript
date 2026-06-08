import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BIO = 300;

// PATCH /api/me/profile  { bio?, featuredBadge? }
export async function PATCH(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { bio?: string; featuredBadge?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.bio === "string") {
    update.bio = body.bio.trim().slice(0, MAX_BIO);
  }
  if ("featuredBadge" in body) {
    const fb = body.featuredBadge;
    update.featured_badge =
      typeof fb === "string" && fb ? fb.slice(0, 50) : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("users")
    .update(update)
    .eq("id", session.userId);
  if (error) {
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
