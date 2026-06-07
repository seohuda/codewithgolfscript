"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Group {
  id: number;
  name: string;
  description: string;
  sort_order: number;
}

export default function AdminStepsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [fetching, setFetching] = useState(true);
  const [denied, setDenied] = useState(false);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [order, setOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // inline edit
  const [editId, setEditId] = useState<number | null>(null);
  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eOrder, setEOrder] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) setDenied(true);
  }, [loading, user]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/step-groups", { cache: "no-store" });
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      const data = await res.json();
      setGroups(data.groups ?? []);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user?.isAdmin) load();
  }, [loading, user, load]);

  async function create() {
    setError(null);
    if (!name.trim()) {
      setError("단계 이름을 입력해 주세요.");
      return;
    }
    const res = await fetch("/api/admin/step-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc, sort_order: order }),
    });
    if (res.ok) {
      setName("");
      setDesc("");
      setOrder(0);
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? "생성 실패");
    }
  }

  function startEdit(g: Group) {
    setEditId(g.id);
    setEName(g.name);
    setEDesc(g.description);
    setEOrder(g.sort_order);
  }

  async function saveEdit(id: number) {
    const res = await fetch(`/api/admin/step-groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: eName, description: eDesc, sort_order: eOrder }),
    });
    if (res.ok) {
      setEditId(null);
      load();
    } else {
      const d = await res.json();
      alert(d.error ?? "수정 실패");
    }
  }

  async function remove(id: number, gname: string) {
    if (!confirm(`"${gname}" 단계를 삭제하시겠습니까? 이 단계의 문제들은 단계 미지정으로 바뀝니다.`))
      return;
    const res = await fetch(`/api/admin/step-groups/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const d = await res.json();
      alert(d.error ?? "삭제 실패");
    }
  }

  if (loading) {
    return <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>;
  }
  if (denied) {
    return (
      <div className="space-y-4">
        <div className="card p-10 text-center text-sm text-ink-soft">
          관리자만 접근할 수 있습니다.
        </div>
        <button onClick={() => router.push("/")} className="btn-outlined">홈으로</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/admin" className="hover:text-accent hover:underline">관리자</Link>
        <span>/</span>
        <span className="text-ink-soft">단계 관리</span>
      </div>
      <h1 className="text-2xl font-bold text-ink">단계 관리</h1>

      {/* Create */}
      <div className="card space-y-3 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">새 단계</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="단계 이름 (예: 입출력과 기본 연산)"
            className="field"
          />
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            placeholder="순서"
            className="field w-24"
          />
        </div>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="설명 (선택)"
          className="field"
        />
        {error && <p className="bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <button onClick={create} className="btn-filled">단계 추가</button>
      </div>

      {/* List */}
      {fetching ? (
        <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>
      ) : groups.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">단계가 없습니다.</div>
      ) : (
        <div className="card divide-y divide-surface-border">
          {groups.map((g) => (
            <div key={g.id} className="p-4">
              {editId === g.id ? (
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input value={eName} onChange={(e) => setEName(e.target.value)} className="field" />
                    <input type="number" value={eOrder} onChange={(e) => setEOrder(Number(e.target.value))} className="field w-24" />
                  </div>
                  <input value={eDesc} onChange={(e) => setEDesc(e.target.value)} className="field" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(g.id)} className="btn-filled px-3 py-1.5 text-xs">저장</button>
                    <button onClick={() => setEditId(null)} className="btn-outlined px-3 py-1.5 text-xs">취소</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      <span className="mr-2 font-mono text-xs text-ink-faint">#{g.sort_order}</span>
                      {g.name}
                    </p>
                    {g.description && (
                      <p className="mt-0.5 text-xs text-ink-faint">{g.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(g)} className="text-xs font-medium text-accent hover:underline">수정</button>
                    <button onClick={() => remove(g.id, g.name)} className="text-xs font-medium text-danger hover:underline">삭제</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
