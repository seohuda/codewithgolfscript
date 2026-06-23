import type { MetadataRoute } from "next";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const SITE_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/problems",
    "/steps",
    "/ranking",
    "/board",
  ].map((p) => ({
    url: `${SITE_BASE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: p === "" ? 1 : 0.8,
  }));

  let problemRoutes: MetadataRoute.Sitemap = [];
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("problems")
      .select("id, created_at")
      .range(0, 9999);
    problemRoutes = (data ?? []).map((p) => ({
      url: `${SITE_BASE_URL}/problems/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at as string) : new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    /* fall back to static routes only */
  }

  return [...staticRoutes, ...problemRoutes];
}
