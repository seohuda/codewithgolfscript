import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/notifications — my notifications + unread count
export async function GET(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ notifications: [], unread: 0 });
  }
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("notifications")
      .select("id, actor, type, post_id, message, is_read, created_at")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .range(0, 49);
    const list = data ?? [];
    const unread = list.filter((n) => !n.is_read).length;
    return NextResponse.json({ notifications: list, unread });
  } catch {
    return NextResponse.json({ notifications: [], unread: 0 });
  }
}

// POST /api/notifications/read — mark all (or one) as read
export async function POST(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  let body: { id?: number } = {};
  try {
    body = await req.json();
  } catch {
    /* no body = mark all */
  }

  const admin = getSupabaseAdminClient();
  let q = admin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", session.userId);
  if (typeof body.id === "number") q = q.eq("id", body.id);
  await q;
  return NextResponse.json({ ok: true });
}
