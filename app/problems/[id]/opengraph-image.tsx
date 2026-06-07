import { ImageResponse } from "next/og";
import { getTierInfo } from "@/lib/tiers";

export const runtime = "nodejs";
export const alt = "문제 · CODE WITH GOLFSCRIPT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function fetchProblem(
  id: number,
): Promise<{ title: string; tier: number; tags: string[] } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/problems?id=eq.${id}&select=title,tier,tags`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      },
    );
    const rows = (await res.json()) as {
      title: string;
      tier: number;
      tags: string[] | null;
    }[];
    const r = rows?.[0];
    if (!r) return null;
    return { title: r.title, tier: r.tier ?? 0, tags: r.tags ?? [] };
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: { id: string } }) {
  const problem = await fetchProblem(Number(params.id));
  const title = problem?.title ?? "문제";
  const info = getTierInfo(problem?.tier ?? 0);
  const tags = problem?.tags ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 3,
            color: "#f97316",
            textTransform: "uppercase",
          }}
        >
          CODE WITH GOLFSCRIPT
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              color: "#0a0a0a",
              background: info.color,
              padding: "8px 24px",
            }}
          >
            {info.nameKo}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.1,
            marginTop: 24,
          }}
        >
          {title}
        </div>

        {tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: "auto",
            }}
          >
            {tags.slice(0, 5).map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  fontSize: 28,
                  color: "#a3a3a3",
                  border: "2px solid #404040",
                  padding: "6px 18px",
                }}
              >
                #{t}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
