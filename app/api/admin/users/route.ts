import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

// GET /api/admin/users?q=&page=1 — list users with submission stats.
export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const admin = getSupabaseAdminClient();

  let query = admin
    .from("users")
    .select("id, username, email, is_admin, banned_until, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (q) {
    const safe = q.replace(/[\\%_,()*]/g, "").slice(0, 60);
    if (safe) query = query.ilike("username", `%${safe}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data: users, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: "불러오지 못했습니다." }, { status: 500 });
  }

  // Per-user submission counts (total + AC) for the listed page.
  const ids = (users ?? []).map((u) => u.id as string);
  const statMap = new Map<string, { total: number; ac: number; last: string | null }>();
  if (ids.length > 0) {
    const { data: subs } = await admin
      .from("submissions")
      .select("user_id, verdict, created_at")
      .in("user_id", ids)
      .range(0, 199999);
    for (const s of subs ?? []) {
      const uid = s.user_id as string;
      if (!statMap.has(uid)) statMap.set(uid, { total: 0, ac: 0, last: null });
      const st = statMap.get(uid)!;
      st.total += 1;
      if (s.verdict === "AC") st.ac += 1;
      const ts = s.created_at as string;
      if (!st.last || ts > st.last) st.last = ts;
    }
  }

  const now = Date.now();
  const list = (users ?? []).map((u) => {
    const st = statMap.get(u.id as string);
    const banned =
      !!u.banned_until && new Date(u.banned_until as string).getTime() > now;
    return {
      id: u.id,
      username: u.username,
      email: u.email ?? null,
      isAdmin: !!u.is_admin,
      banned,
      bannedUntil: u.banned_until ?? null,
      createdAt: u.created_at,
      totalSubmissions: st?.total ?? 0,
      acSubmissions: st?.ac ?? 0,
      lastSubmission: st?.last ?? null,
    };
  });

  return NextResponse.json({
    users: list,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}
