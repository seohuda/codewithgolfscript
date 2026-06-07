import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// GET /api/problems?q=&tierMin=&tierMax=&group=&sort=tier|id&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tierMin = searchParams.get("tierMin");
  const tierMax = searchParams.get("tierMax");
  const group = (searchParams.get("group") ?? "").trim();
  const sort = searchParams.get("sort") === "id" ? "id" : "tier";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  try {
    const admin = getSupabaseAdminClient();
    let query = admin
      .from("problems")
      .select("id, title, tier, source, step_group", { count: "exact" });

    if (q) {
      // Escape PostgREST/LIKE wildcards so user input is treated literally.
      const safe = q.replace(/[\\%_,()*]/g, "").slice(0, 100);
      if (safe) query = query.ilike("title", `%${safe}%`);
    }
    if (group) query = query.eq("step_group", group);
    if (tierMin !== null && tierMin !== "") {
      const t = Number(tierMin);
      if (Number.isFinite(t)) query = query.gte("tier", t);
    }
    if (tierMax !== null && tierMax !== "") {
      const t = Number(tierMax);
      if (Number.isFinite(t)) query = query.lte("tier", t);
    }

    if (sort === "id") {
      query = query.order("id", { ascending: true });
    } else {
      query = query.order("tier", { ascending: true }).order("id", {
        ascending: true,
      });
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json(
        { error: "문제를 불러오지 못했습니다.", problems: [], total: 0, pageSize: PAGE_SIZE },
        { status: 500 },
      );
    }

    // Per-problem stats (solved-people count + acceptance rate) for the page.
    const ids = (data ?? []).map((p) => p.id as number);
    const statMap = new Map<
      number,
      { solvers: Set<string>; ac: number; total: number }
    >();
    if (ids.length > 0) {
      const { data: subs } = await admin
        .from("submissions")
        .select("problem_id, user_id, verdict")
        .in("problem_id", ids)
        .range(0, 99999);
      for (const s of subs ?? []) {
        const pid = s.problem_id as number;
        if (!statMap.has(pid))
          statMap.set(pid, { solvers: new Set(), ac: 0, total: 0 });
        const st = statMap.get(pid)!;
        st.total += 1;
        if (s.verdict === "AC") {
          st.ac += 1;
          st.solvers.add(s.user_id as string);
        }
      }
    }

    const problems = (data ?? []).map((p) => {
      const st = statMap.get(p.id as number);
      const solvedCount = st ? st.solvers.size : 0;
      const acRate =
        st && st.total > 0 ? Math.round((st.ac / st.total) * 1000) / 10 : 0;
      return { ...p, solvedCount, acRate };
    });

    return NextResponse.json({
      problems,
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "오류",
        problems: [],
        total: 0,
        pageSize: PAGE_SIZE,
      },
      { status: 500 },
    );
  }
}
