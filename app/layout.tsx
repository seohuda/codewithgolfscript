import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderNav from "@/components/HeaderNav";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.golfscript.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CODE WITH GOLFSCRIPT",
    template: "%s · CODE WITH GOLFSCRIPT",
  },
  description:
    "GolfScript 전용 숏코딩 채점 사이트. 가장 적은 바이트로 푸는 사람이 승리합니다.",
  applicationName: "CODE WITH GOLFSCRIPT",
  keywords: [
    "GolfScript",
    "코드 골프",
    "code golf",
    "숏코딩",
    "온라인 저지",
    "알고리즘",
    "PS",
  ],
  openGraph: {
    type: "website",
    siteName: "CODE WITH GOLFSCRIPT",
    title: "CODE WITH GOLFSCRIPT",
    description:
      "GolfScript 전용 숏코딩 채점 사이트. 가장 적은 바이트로 푸는 사람이 승리합니다.",
    url: SITE_URL,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CODE WITH GOLFSCRIPT",
    description:
      "GolfScript 전용 숏코딩 채점 사이트. 가장 적은 바이트로 푸는 사람이 승리합니다.",
  },
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
            <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/90 backdrop-blur-md">
              <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
                <Link href="/" className="flex items-center gap-2.5">
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
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-6">
                <span className="text-base font-extrabold uppercase tracking-tight text-ink">
                  CODE WITH GOLF<span className="text-accent">SCRIPT</span>
                </span>
                <span className="eyebrow">© 2026</span>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
