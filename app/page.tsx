import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { Problem } from "@/lib/types";
import TierBadge from "@/components/TierBadge";

export const dynamic = "force-dynamic";

interface BoardPostRow {
  id: number;
  author: string;
  title: string;
  created_at: string;
  comment_count: number;
}

async function getData() {
  try {
    const admin = getSupabaseAdminClient();
    const [probsRes, postsRes, usersRes] = await Promise.all([
      admin
        .from("problems")
        .select("id, title, tier, source")
        .order("id", { ascending: false })
        .limit(8),
      admin
        .from("board_posts")
        .select("id, author, title, created_at, comment_count")
        .order("created_at", { ascending: false })
        .limit(5),
      admin.from("problems").select("*", { count: "exact", head: true }),
    ]);
    return {
      problems: (probsRes.data ?? []) as Problem[],
      posts: (postsRes.data ?? []) as BoardPostRow[],
      problemCount: usersRes.count ?? 0,
    };
  } catch {
    return { problems: [], posts: [], problemCount: 0 };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default async function HomePage() {
  const { problems, posts, problemCount } = await getData();

  return (
    <div className="animate-fade-in space-y-10">
      {/* Editorial hero */}
      <section className="border border-surface-border bg-surface">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-2">
          <span className="eyebrow">GolfScript Online Judge</span>
          <span className="eyebrow hidden sm:inline">EST. 2026 / KR</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="border-b border-surface-border p-6 md:col-span-2 md:border-b-0 md:border-r md:p-10">
            <h1 className="text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl md:text-7xl">
              더 짧게.
              <br />
              <span className="text-accent">바이트</span>로
              <br />
              겨룬다.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
              정답 여부가 아니라 코드의 바이트 수로 순위가 갈리는 GolfScript
              전용 채점소. 한 글자라도 더 줄이세요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/steps" className="btn-filled">
                단계별로 시작 →
              </Link>
              <Link href="/problems" className="btn-outlined">
                전체 문제
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-1 flex-col justify-center gap-1 border-b border-surface-border p-6">
              <span className="eyebrow">등록된 문제</span>
              <span className="font-mono text-4xl font-bold tabular-nums text-ink">
                {String(problemCount).padStart(3, "0")}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 bg-accent p-6 text-white">
              <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-white/80">
                채점 방식
              </span>
              <span className="font-mono text-lg font-bold leading-tight">
                UTF-8
                <br />
                BYTE COUNT
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent problems */}
        <section className="lg:col-span-2">
          <div className="mb-0 flex items-center justify-between border-b-2 border-ink pb-2">
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-ink">
              <span className="inline-block h-3 w-3 bg-accent" />
              최근 추가된 문제
            </h2>
            <Link href="/problems" className="eyebrow hover:text-accent">
              전체 보기 →
            </Link>
          </div>
          <div className="border border-t-0 border-surface-border bg-surface">
            {problems.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-faint">
                문제가 아직 없습니다.
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {problems.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-surface-border last:border-0 hover:bg-surface-variant"
                    >
                      <td className="w-12 px-4 py-3">
                        <TierBadge tier={p.tier ?? 0} size="sm" />
                      </td>
                      <td className="px-2 py-3">
                        <Link
                          href={`/problems/${p.id}`}
                          className="font-medium text-ink hover:text-accent"
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-[11px] text-ink-faint sm:table-cell">
                        {p.source && !p.source.startsWith("자체 제작")
                          ? p.source
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Recent board */}
        <section>
          <div className="mb-0 flex items-center justify-between border-b-2 border-ink pb-2">
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-ink">
              <span className="inline-block h-3 w-3 bg-accent" />
              게시판
            </h2>
            <Link href="/board" className="eyebrow hover:text-accent">
              전체 보기 →
            </Link>
          </div>
          <div className="border border-t-0 border-surface-border bg-surface">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-faint">
                아직 글이 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-surface-border">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/board/${post.id}`}
                      className="block px-4 py-3 hover:bg-surface-variant"
                    >
                      <p className="truncate text-sm font-medium text-ink">
                        {post.title}
                        {post.comment_count > 0 && (
                          <span className="ml-1.5 font-mono text-xs text-accent">
                            [{post.comment_count}]
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                        {post.author} · {timeAgo(post.created_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
