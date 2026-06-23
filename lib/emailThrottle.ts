import type { SupabaseClient } from "@supabase/supabase-js";

export const TOKEN_EMAIL_COOLDOWN_MS = 5 * 60 * 1000;

export type TokenEmailKind = "verify_email" | "reset_password";

export async function isTokenEmailOnCooldown(
  admin: SupabaseClient,
  userId: string,
  kind: TokenEmailKind,
): Promise<boolean> {
  const { data, error } = await admin
    .from("auth_tokens")
    .select("created_at")
    .eq("user_id", userId)
    .eq("type", kind)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return true;
  }
  if (!data?.created_at) {
    return false;
  }

  return Date.now() - new Date(data.created_at as string).getTime() < TOKEN_EMAIL_COOLDOWN_MS;
}
