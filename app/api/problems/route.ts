import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// GET /api/problems?q=...&tier=...&sort=tier|id&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tierMin = searchParams.get("tierMin");
  const tierMax = searchParams.get("tierMax");
  const sort = searchParams.get("sort") === "id" ? "id" : "tier";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  try {
    const admin = getSupabaseAdminClient();
    let query = admin
      .from("problems")
      .select("id, title, tier, source, step_group", { count: "exact" });

    if (q) query = query.ilike("title", `%${q}%`);
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
        { error: error.message, problems: [], total: 0, pageSize: PAGE_SIZE },
        { status: 500 },
      );
    }

    return NextResponse.json({
      problems: data ?? [],
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
