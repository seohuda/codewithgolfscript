import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/problems/tags — distinct tags with usage counts.
export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("problems")
      .select("tags")
      .range(0, 9999);

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const tags = (row.tags as string[] | null) ?? [];
      for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }

    const tags = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ tags: [] }, { status: 500 });
  }
}
