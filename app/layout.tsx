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
      <body className="min-h-screen bg-surface-dim font-sans text-ink antialiased">
        <AuthProvider>
          <header className="sticky top-0 z-40 border-b border-surface-border bg-surface">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
                  gs
                </span>
                <span className="text-base font-bold tracking-tight text-ink">
                  CODE WITH GOLF<span className="text-primary">SCRIPT</span>
                </span>
              </Link>

              <nav className="hidden items-center gap-1 text-sm md:flex">
                <Link
                  href="/steps"
                  className="rounded-md px-3 py-1.5 font-medium text-ink-soft transition-colors hover:bg-surface-variant hover:text-ink"
                >
                  단계별로 풀기
                </Link>
                <Link
                  href="/problems"
                  className="rounded-md px-3 py-1.5 font-medium text-ink-soft transition-colors hover:bg-surface-variant hover:text-ink"
                >
                  전체 문제
                </Link>
                <Link
                  href="/board"
                  className="rounded-md px-3 py-1.5 font-medium text-ink-soft transition-colors hover:bg-surface-variant hover:text-ink"
                >
                  게시판
                </Link>
              </nav>

              <div className="ml-auto">
                <HeaderNav />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

          <footer className="mt-16 border-t border-surface-border bg-surface">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-ink-faint">
              <span className="font-semibold text-ink-soft">
                CODE WITH GOLFSCRIPT
              </span>
              <span>
                정확한 UTF-8 바이트 수로 순위가 매겨집니다. 더 짧을수록 더 높은
                순위.
              </span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
