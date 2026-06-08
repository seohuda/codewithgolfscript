import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accounts that never verified their email within this window are
// considered abandoned and removed.
const UNVERIFIED_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// POST /api/admin/cleanup-unverified
// Deletes unverified accounts older than the TTL. Authorized either by
// an admin session OR a CRON_SECRET bearer token (for scheduled jobs).
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const viaCron =
    !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!viaCron) {
    const adminId = await requireAdmin(req);
    if (!adminId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
  }

  const admin = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - UNVERIFIED_TTL_MS).toISOString();

  // Find stale unverified accounts. Never touch admins as a safety net.
  const { data: stale, error } = await admin
    .from("users")
    .select("id, username")
    .eq("email_verified", false)
    .eq("is_admin", false)
    .lt("created_at", cutoff)
    .range(0, 999);

  if (error) {
    return NextResponse.json({ error: "조회 실패." }, { status: 500 });
  }

  const ids = (stale ?? []).map((u) => u.id as string);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  // submissions / auth_tokens cascade via FK on user delete.
  const { error: delErr } = await admin.from("users").delete().in("id", ids);
  if (delErr) {
    return NextResponse.json({ error: "삭제 실패." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: ids.length });
}
