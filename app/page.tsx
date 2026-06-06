import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getStats(): Promise<{ problems: number; users: number }> {
  try {
    const admin = getSupabaseAdminClient();
    const [{ count: problems }, { count: users }] = await Promise.all([
      admin.from("problems").select("*", { count: "exact", head: true }),
      admin.from("users").select("*", { count: "exact", head: true }),
    ]);
    return { problems: problems ?? 0, users: users ?? 0 };
  } catch {
    return { problems: 0, users: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-e1">
        <div className="bg-gradient-to-br from-primary to-primary-light px-8 py-12 text-white">
          <p className="mb-2 text-sm font-medium opacity-90">
            GolfScript 전용 숏코딩 채점소
          </p>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">
            가장 적은 바이트로 푸세요
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-90">
            정답 여부가 아니라 코드의 바이트 수로 순위가 매겨지는 곳. solved.ac
            스타일의 티어로 실력을 확인하고, 한 글자라도 더 줄여 보세요.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/problems"
              className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-e1 transition-shadow hover:shadow-e2"
            >
              문제 풀러 가기
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              회원가입
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4">
        <div className="card p-6">
          <p className="text-sm text-ink-soft">등록된 문제</p>
          <p className="mt-1 text-3xl font-bold text-ink">{stats.problems}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-ink-soft">가입한 유저</p>
          <p className="mt-1 text-3xl font-bold text-ink">{stats.users}</p>
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/problems"
          className="card group flex items-center justify-between p-6 transition-shadow hover:shadow-e2"
        >
          <div>
            <h3 className="text-lg font-semibold text-ink">문제 목록</h3>
            <p className="mt-1 text-sm text-ink-soft">
              티어별로 정렬된 100문제에 도전하세요.
            </p>
          </div>
          <span className="text-2xl text-primary transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
        <Link
          href="/board"
          className="card group flex items-center justify-between p-6 transition-shadow hover:shadow-e2"
        >
          <div>
            <h3 className="text-lg font-semibold text-ink">게시판</h3>
            <p className="mt-1 text-sm text-ink-soft">
              풀이를 공유하고 질문을 나눠 보세요.
            </p>
          </div>
          <span className="text-2xl text-primary transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </section>
    </div>
  );
}
