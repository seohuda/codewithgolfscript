import { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

/**
 * Verifies the request comes from a logged-in admin.
 * Returns the userId on success, or null otherwise.
 */
export async function requireAdmin(req: NextRequest): Promise<string | null> {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .select("is_admin")
      .eq("id", session.userId)
      .maybeSingle();
    if (!data?.is_admin) return null;
    return session.userId;
  } catch {
    return null;
  }
}
