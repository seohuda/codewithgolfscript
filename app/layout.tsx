import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderNav from "@/components/HeaderNav";

export const metadata: Metadata = {
  title: "CODE WITH GOLFSCRIPT",
  description:
    "GolfScript 전용 숏코딩 채점 사이트. 가장 적은 바이트로 푸는 사람이 승리합니다.",
};

// Prevents a flash of the wrong theme before hydration.
const themeInitScript = `
(function(){try{var t=localStorage.getItem('theme');var d=t? t==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-surface-dim font-sans text-ink antialiased">
        <ThemeProvider>
          <AuthProvider>
            {/* Accent ticker */}
            <div className="overflow-hidden border-b border-surface-border bg-accent text-white">
              <div className="flex whitespace-nowrap py-1 font-mono text-[11px] uppercase tracking-widest">
                <div className="flex shrink-0 animate-marquee gap-8 pr-8">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <span key={i} className="flex gap-8">
                      <span>SHORTER IS BETTER</span>
                      <span>·</span>
                      <span>BYTES NOT LINES</span>
                      <span>·</span>
                      <span>GOLFSCRIPT ONLY</span>
                      <span>·</span>
                      <span>CODE WITH GOLFSCRIPT</span>
                      <span>·</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/90 backdrop-blur-md">
              <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
                <Link href="/" className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center border border-surface-border bg-primary text-xs font-extrabold text-surface">
                    gs
                  </span>
                  <span className="text-base font-extrabold uppercase tracking-tight text-ink">
                    CODE WITH GOLF<span className="text-accent">SCRIPT</span>
                  </span>
                </Link>

                <nav className="hidden items-center gap-1 md:flex">
                  <Link
                    href="/problems"
                    className="px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wide text-ink-soft transition-colors hover:text-accent"
                  >
                    전체 문제
                  </Link>
                  <Link
                    href="/steps"
                    className="px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wide text-ink-soft transition-colors hover:text-accent"
                  >
                    단계별
                  </Link>
                  <Link
                    href="/board"
                    className="px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wide text-ink-soft transition-colors hover:text-accent"
                  >
                    게시판
                  </Link>
                  <Link
                    href="/ranking"
                    className="px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wide text-ink-soft transition-colors hover:text-accent"
                  >
                    랭킹
                  </Link>
                </nav>

                <div className="ml-auto flex items-center gap-2">
                  <ThemeToggle />
                  <HeaderNav />
                </div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
              {children}
            </main>

            <footer className="border-t border-surface-border bg-surface">
              <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8">
                <span className="text-lg font-extrabold uppercase tracking-tight text-ink">
                  CODE WITH GOLF<span className="text-accent">SCRIPT</span>
                </span>
                <span className="eyebrow">
                  Ranked by exact UTF-8 byte count — fewer bytes, higher rank.
                </span>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
