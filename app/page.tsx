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
    <div className="animate-fade-in space-y-8">
      {/* Spotify-style gradient hero */}
      <section className="relative overflow-hidden rounded-2xl p-8 sm:p-10">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--primary-dark)) 45%, rgb(var(--surface)) 120%)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(120% 120% at 100% 0%, rgb(var(--surface) / 0.0) 40%, rgb(var(--surface) / 0.85) 100%)",
          }}
        />
        <p className="text-sm font-bold uppercase tracking-widest text-black/70">
          GolfScript Online Judge
        </p>
        <h1 className="mt-2 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-black sm:text-5xl">
          더 짧게.
          <br />
          바이트로 겨루는 코드.
        </h1>
        <p className="mt-4 max-w-xl text-base font-medium text-black/80">
          정답이 아니라 코드 길이로 순위가 갈리는 곳. 지금 {problemCount}개의
          문제가 티어별로 준비돼 있습니다.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/steps"
            className="rounded-full bg-black px-7 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
          >
            단계별로 풀기
          </Link>
          <Link
            href="/problems"
            className="rounded-full border border-black/30 px-7 py-3 text-sm font-bold text-black transition-all hover:border-black hover:scale-105"
          >
            전체 문제
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent problems */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">최근 추가된 문제</h2>
            <Link
              href="/problems"
              className="text-xs font-medium text-primary hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="card overflow-hidden">
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
                      className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
                    >
                      <td className="w-12 px-4 py-3">
                        <TierBadge tier={p.tier ?? 0} size="sm" />
                      </td>
                      <td className="px-2 py-3">
                        <Link
                          href={`/problems/${p.id}`}
                          className="font-medium text-ink hover:text-primary hover:underline"
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-right text-xs text-ink-faint sm:table-cell">
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">게시판</h2>
            <Link
              href="/board"
              className="text-xs font-medium text-primary hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="card overflow-hidden">
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
                      className="block px-4 py-3 hover:bg-surface-dim"
                    >
                      <p className="truncate text-sm font-medium text-ink">
                        {post.title}
                        {post.comment_count > 0 && (
                          <span className="ml-1.5 text-xs text-primary">
                            [{post.comment_count}]
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-faint">
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
