import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  let isAdmin = false;
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .select("is_admin")
      .eq("id", session.userId)
      .maybeSingle();
    isAdmin = !!data?.is_admin;
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    user: { id: session.userId, username: session.username, isAdmin },
  });
}
