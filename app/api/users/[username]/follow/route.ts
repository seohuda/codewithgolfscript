import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE, escapeLike } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveTarget(username: string) {
  if (!/^[A-Za-z0-9_]+$/.test(username)) return null;
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, username")
    .ilike("username", escapeLike(username))
    .maybeSingle();
  return data;
}

// POST /api/users/[username]/follow — follow this user.
export async function POST(
  req: NextRequest,
  { params }: { params: { username: string } },
) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  let username = "";
  try {
    username = decodeURIComponent(params.username ?? "").trim();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const target = await resolveTarget(username);
  if (!target) {
    return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });
  }
  if (target.id === session.userId) {
    return NextResponse.json(
      { error: "자기 자신은 팔로우할 수 없습니다." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("follows")
    .upsert(
      { follower_id: session.userId, following_id: target.id },
      { onConflict: "follower_id,following_id" },
    );
  if (error) {
    return NextResponse.json({ error: "팔로우에 실패했습니다." }, { status: 500 });
  }

  // Notify the followed user (best-effort, only on a new follow).
  try {
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", target.id)
      .eq("type", "follow")
      .eq("actor", session.username)
      .maybeSingle();
    if (!existing) {
      await admin.from("notifications").insert({
        user_id: target.id,
        actor: session.username,
        type: "follow",
        message: `${session.username}님이 회원님을 팔로우하기 시작했습니다.`,
      });
    }
  } catch {
    /* notification failure must not block the follow */
  }

  return NextResponse.json({ ok: true, following: true });
}

// DELETE /api/users/[username]/follow — unfollow this user.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { username: string } },
) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  let username = "";
  try {
    username = decodeURIComponent(params.username ?? "").trim();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const target = await resolveTarget(username);
  if (!target) {
    return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("follows")
    .delete()
    .eq("follower_id", session.userId)
    .eq("following_id", target.id);
  if (error) {
    return NextResponse.json({ error: "언팔로우에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, following: false });
}
