import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  hashPassword,
  validateUsername,
  validatePassword,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  const userErr = validateUsername(username);
  if (userErr) return NextResponse.json({ error: userErr }, { status: 400 });

  const passErr = validatePassword(password);
  if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });

  const admin = getSupabaseAdminClient();

  // Check for an existing account (case-insensitive).
  const { data: existing, error: selErr } = await admin
    .from("users")
    .select("id, username, password_hash")
    .ilike("username", username)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json(
      { error: `데이터베이스 오류: ${selErr.message}` },
      { status: 500 },
    );
  }

  if (existing) {
    // If the username exists but has no password (legacy seed user),
    // claim it by setting the password. Otherwise reject.
    if (existing.password_hash) {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디입니다." },
        { status: 409 },
      );
    }
    const { error: updErr } = await admin
      .from("users")
      .update({ password_hash: hashPassword(password) })
      .eq("id", existing.id);

    if (updErr) {
      return NextResponse.json(
        { error: `계정 생성 실패: ${updErr.message}` },
        { status: 500 },
      );
    }

    const token = createSessionToken({
      userId: existing.id as string,
      username: existing.username as string,
    });
    const res = NextResponse.json({
      user: { id: existing.id, username: existing.username },
    });
    res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return res;
  }

  // Create a brand-new user.
  const { data: created, error: insErr } = await admin
    .from("users")
    .insert({ username, password_hash: hashPassword(password) })
    .select("id, username")
    .single();

  if (insErr || !created) {
    // Unique violation safety net.
    if (insErr?.code === "23505") {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디입니다." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: `계정 생성 실패: ${insErr?.message ?? "알 수 없는 오류"}` },
      { status: 500 },
    );
  }

  const token = createSessionToken({
    userId: created.id as string,
    username: created.username as string,
  });
  const res = NextResponse.json({
    user: { id: created.id, username: created.username },
  });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
