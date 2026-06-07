import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CODE WITH GOLFSCRIPT";
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
          Online Judge
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: 12,
            textTransform: "uppercase",
          }}
        >
          CODE WITH GOLF
          <span style={{ color: "#f97316" }}>SCRIPT</span>
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
          ~,{"{)}"}%{"{+}"}* — golfscript.xyz
        </div>
      </div>
    ),
    { ...size },
  );
}
