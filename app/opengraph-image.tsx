import { ImageResponse } from "next/og";
import { SITE_FULL_NAME, SITE_NAME, SITE_SUBTITLE, SITE_URL } from "@/lib/site";

export const runtime = "edge";
export const alt = SITE_FULL_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 4,
            color: "#f97316",
            textTransform: "uppercase",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: 12,
          }}
        >
          {SITE_SUBTITLE}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            marginTop: 28,
            color: "#a3a3a3",
          }}
        >
          가장 적은 바이트로 푸는 사람이 승리합니다.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 28,
            fontFamily: "monospace",
            color: "#737373",
          }}
        >
          ~,{"{)}"}%{"{+}"}* — {SITE_URL}
        </div>
      </div>
    ),
    { ...size },
  );
}
