import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { escapeLike } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/users/[username]/follows?type=followers|following
// Lists the users who follow this profile, or whom it follows.
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } },
) {
  let username = "";
  try {
    username = decodeURIComponent(params.username ?? "").trim();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "following" ? "following" : "followers";

  const admin = getSupabaseAdminClient();
  const { data: user } = await admin
    .from("users")
    .select("id")
    .ilike("username", escapeLike(username))
    .maybeSingle();
  if (!user) {
    return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  // followers: rows where following_id = user → take follower_id
  // following: rows where follower_id = user → take following_id
  const col = type === "followers" ? "following_id" : "follower_id";
  const pick = type === "followers" ? "follower_id" : "following_id";

  const { data: rows } = await admin
    .from("follows")
    .select("follower_id, following_id, created_at")
    .eq(col, user.id)
    .order("created_at", { ascending: false })
    .range(0, 499);

  const ids = [...new Set((rows ?? []).map((r) => r[pick] as string))];
  if (ids.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const { data: people } = await admin
    .from("users")
    .select("id, username, bio")
    .in("id", ids);

  // Preserve the follow order (most recent first).
  const byId = new Map(
    (people ?? []).map((p) => [p.id as string, p]),
  );
  const list = ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p) => ({
      username: (p as { username: string }).username,
      bio: (p as { bio?: string }).bio ?? "",
    }));

  return NextResponse.json({ users: list });
}
