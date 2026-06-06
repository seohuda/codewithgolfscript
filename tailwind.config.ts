import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        abyss: {
          DEFAULT: "#05060a",
          900: "#070912",
          800: "#0b0e1a",
          700: "#111526",
          600: "#181d33",
          500: "#222843",
        },
        aurora: {
          indigo: "#6366f1",
          violet: "#8b5cf6",
          cyan: "#22d3ee",
          glow: "#a5b4fc",
        },
        mist: {
          DEFAULT: "#c7ccdb",
          faint: "#7b8294",
          soft: "#9aa1b8",
          dim: "#5b6075",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        aurora:
          "0 0 0 1px rgba(99,102,241,0.15), 0 8px 40px -12px rgba(99,102,241,0.4)",
        "aurora-soft": "0 0 30px -8px rgba(139,92,246,0.45)",
      },
      backgroundImage: {
        "aurora-gradient":
          "linear-gradient(120deg, #6366f1 0%, #8b5cf6 45%, #22d3ee 100%)",
        "abyss-radial":
          "radial-gradient(1200px 600px at 50% -10%, rgba(99,102,241,0.12), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(34,211,238,0.08), transparent 60%)",
      },
      keyframes: {
        "aurora-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "aurora-pulse": "aurora-pulse 3.5s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
