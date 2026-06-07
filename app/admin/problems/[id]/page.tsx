"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import AdminProblemForm, {
  ProblemDraft,
  TestCaseDraft,
} from "@/components/AdminProblemForm";

export default function EditProblemPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, loading } = useAuth();

  const [draft, setDraft] = useState<ProblemDraft | null>(null);
  const [cases, setCases] = useState<TestCaseDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user?.isAdmin) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/problems/${id}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.problem) {
          setError(data.error ?? "불러오지 못했습니다.");
          return;
        }
        const p = data.problem;
        setDraft({
          title: p.title ?? "",
          description: p.description ?? "",
          input_desc: p.input_desc ?? "",
          output_desc: p.output_desc ?? "",
          tier: p.tier ?? 0,
          source: p.source ?? "",
          step_group: p.step_group ?? "",
          step_order: p.step_order ?? 0,
          sample_input: p.sample_input ?? "",
          sample_output: p.sample_output ?? "",
        });
        setCases(
          (data.cases ?? []).map((c: TestCaseDraft) => ({
            stdin: c.stdin,
            stdout: c.stdout,
            is_hidden: c.is_hidden,
          })),
        );
      } finally {
        if (!cancelled) setFetching(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, loading, user]);

  if (loading || !user?.isAdmin || fetching) {
    return <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>;
  }
  if (error || !draft) {
    return (
      <div className="space-y-4">
        <div className="card p-10 text-center text-sm text-ink-soft">
          {error ?? "문제를 찾을 수 없습니다."}
        </div>
        <Link href="/admin" className="btn-outlined">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/admin" className="hover:text-accent hover:underline">
          관리자
        </Link>
        <span>/</span>
        <span className="font-mono text-ink-soft">#{id}</span>
      </div>
      <h1 className="text-2xl font-bold text-ink">문제 수정</h1>
      <AdminProblemForm
        mode="edit"
        problemId={Number(id)}
        initial={draft}
        initialCases={cases}
      />
    </div>
  );
}
