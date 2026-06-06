import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser / client-side Supabase client.
 * Uses the public anon key. Bound by Row Level Security, so it can
 * read users, problems, submissions and the leaderboard view, but it
 * can NEVER read the `test_cases` table (no SELECT policy exists).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    );
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Defer the error until a method is actually invoked at runtime.
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          "Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        );
      },
    });
  }
  return getSupabaseBrowserClient();
})();
