import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/step-groups — public list of step groups (ordered)
export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("step_groups")
      .select("id, name, description, sort_order")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (error) {
      return NextResponse.json({ groups: [] }, { status: 500 });
    }
    return NextResponse.json({ groups: data ?? [] });
  } catch {
    return NextResponse.json({ groups: [] }, { status: 500 });
  }
}
