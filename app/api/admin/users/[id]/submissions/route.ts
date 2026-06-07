import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// GET /api/admin/users/[id]/submissions?page=1
// Returns a target user's submissions (incl. code) for monitoring.
// Each access is recorded in the admin audit log.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const userId = params.id;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const admin = getSupabaseAdminClient();

  // Resolve the target user.
  const { data: target } = await admin
    .from("users")
    .select("id, username, email, is_admin, banned_until, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: subs, error, count } = await admin
    .from("submissions")
    .select("id, problem_id, code, bytes, verdict, created_at", {
      count: "exact",
    })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: "불러오지 못했습니다." }, { status: 500 });
  }

  const list = subs ?? [];
  const problemIds = [...new Set(list.map((s) => s.problem_id))];
  const titleMap = new Map<number, string>();
  if (problemIds.length > 0) {
    const { data: probs } = await admin
      .from("problems")
      .select("id, title")
      .in("id", problemIds);
    for (const p of probs ?? []) {
      titleMap.set(p.id as number, p.title as string);
    }
  }

  const submissions = list.map((s) => ({
    id: s.id,
    problemId: s.problem_id,
    problemTitle: titleMap.get(s.problem_id) ?? `#${s.problem_id}`,
    code: s.code,
    bytes: s.bytes,
    verdict: s.verdict,
    created_at: s.created_at,
  }));

  // Record this monitoring access (best-effort).
  await logAdminAction({
    adminId,
    action: "view_user_submissions",
    targetType: "user",
    targetId: userId,
    detail: `${target.username} 제출 기록 열람 (page ${page})`,
  });

  return NextResponse.json({
    user: {
      id: target.id,
      username: target.username,
      email: target.email ?? null,
      isAdmin: !!target.is_admin,
      bannedUntil: target.banned_until ?? null,
      createdAt: target.created_at,
    },
    submissions,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}
