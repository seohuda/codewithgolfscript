import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import HeaderNav from "@/components/HeaderNav";

export const metadata: Metadata = {
  title: "CODE WITH GOLFSCRIPT",
  description:
    "GolfScript 전용 숏코딩 채점 사이트. 가장 적은 바이트로 푸는 사람이 승리합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-abyss bg-abyss-radial font-sans antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-abyss-radial" />
        <AuthProvider>
          <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-abyss-900/70 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
              <Link href="/" className="group flex items-center gap-3">
                <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-aurora-gradient text-sm font-bold text-white shadow-aurora-soft">
                  gs
                  <span className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-aurora-pulse bg-aurora-gradient blur-md" />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-sm font-semibold tracking-wide text-mist">
                    CODE WITH{" "}
                    <span className="aurora-text font-bold">GOLFSCRIPT</span>
                  </span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-mist-dim">
                    숏코딩 채점소
                  </span>
                </span>
              </Link>
              <HeaderNav />
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
          <footer className="mt-20 border-t border-white/[0.06]">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-xs text-mist-dim">
              <span>정확한 UTF-8 바이트 수로 순위가 매겨집니다. 더 짧을수록 더 높은 순위.</span>
              <span className="aurora-text font-medium">GolfOnlineJudge</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
