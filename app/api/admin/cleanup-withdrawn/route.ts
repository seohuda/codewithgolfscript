import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WITHDRAWAL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const viaCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!viaCron) {
    const adminId = await requireAdmin(req);
    if (!adminId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
  }

  const admin = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - WITHDRAWAL_TTL_MS).toISOString();

  const { data: stale, error } = await admin
    .from("users")
    .select("id, username")
    .not("withdrawal_requested_at", "is", null)
    .lt("withdrawal_requested_at", cutoff)
    .eq("is_admin", false)
    .range(0, 999);

  if (error) {
    return NextResponse.json({ error: "조회 실패." }, { status: 500 });
  }

  const ids = (stale ?? []).map((u) => u.id as string);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const { error: delErr } = await admin.from("users").delete().in("id", ids);
  if (delErr) {
    return NextResponse.json({ error: "삭제 실패." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: ids.length });
}
