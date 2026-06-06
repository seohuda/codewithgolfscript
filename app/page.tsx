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
      {/* Compact intro strip */}
      <section className="flex flex-col gap-4 rounded-xl border border-surface-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">
            바이트로 겨루는 GolfScript 채점소
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            정답보다 짧은 코드. 현재 {problemCount}개의 문제가 티어별로 준비돼
            있습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/problems" className="btn-filled whitespace-nowrap">
            문제 풀기
          </Link>
          <Link href="/board" className="btn-outlined whitespace-nowrap">
            게시판
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
                        {p.source || "자체 제작"}
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
