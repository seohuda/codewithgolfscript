"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";

interface FollowUser {
  username: string;
  bio: string;
}

function FollowsInner() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const username = Array.isArray(params.username)
    ? params.username[0]
    : params.username;
  const type = search.get("type") === "following" ? "following" : "followers";

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/${username}/follows?type=${type}`,
        { cache: "no-store" },
      );
      const d = await res.json();
      setUsers(res.ok ? (d.users ?? []) : []);
    } finally {
      setLoading(false);
    }
  }, [username, type]);

  useEffect(() => {
    load();
  }, [load]);

  function setType(t: "followers" | "following") {
    router.replace(`/users/${username}/follows?type=${t}`);
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link
          href={`/users/${username}`}
          className="hover:text-accent hover:underline"
        >
          {username}
        </Link>
        <span>/</span>
        <span className="text-ink-soft">
          {type === "followers" ? "팔로워" : "팔로잉"}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setType("followers")}
          className={
            type === "followers"
              ? "btn-filled px-4 py-1.5 text-sm"
              : "btn-outlined px-4 py-1.5 text-sm"
          }
        >
          팔로워
        </button>
        <button
          onClick={() => setType("following")}
          className={
            type === "following"
              ? "btn-filled px-4 py-1.5 text-sm"
              : "btn-outlined px-4 py-1.5 text-sm"
          }
        >
          팔로잉
        </button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-faint">
          불러오는 중…
        </div>
      ) : users.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          {type === "followers"
            ? "아직 팔로워가 없습니다."
            : "아직 아무도 팔로우하지 않았습니다."}
        </div>
      ) : (
        <div className="card divide-y divide-surface-border">
          {users.map((u) => (
            <Link
              key={u.username}
              href={`/users/${encodeURIComponent(u.username)}`}
              className="flex flex-col gap-0.5 px-4 py-3 hover:bg-surface-dim"
            >
              <span className="font-medium text-accent">{u.username}</span>
              {u.bio && (
                <span className="line-clamp-1 text-xs text-ink-faint">
                  {u.bio}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FollowsPage() {
  return (
    <Suspense
      fallback={
        <div className="card p-10 text-center text-sm text-ink-faint">
          불러오는 중…
        </div>
      }
    >
      <FollowsInner />
    </Suspense>
  );
}
