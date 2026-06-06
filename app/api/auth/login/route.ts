import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  verifyPassword,
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

  if (!username || !password) {
    return NextResponse.json(
      { error: "아이디와 비밀번호를 입력해 주세요." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();

  const { data: user, error } = await admin
    .from("users")
    .select("id, username, password_hash")
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: `데이터베이스 오류: ${error.message}` },
      { status: 500 },
    );
  }

  // Generic message to avoid revealing whether the account exists.
  const invalid = NextResponse.json(
    { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
    { status: 401 },
  );

  if (!user || !user.password_hash) return invalid;
  if (!verifyPassword(password, user.password_hash as string)) return invalid;

  const token = createSessionToken({
    userId: user.id as string,
    username: user.username as string,
  });
  const res = NextResponse.json({
    user: { id: user.id, username: user.username },
  });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
