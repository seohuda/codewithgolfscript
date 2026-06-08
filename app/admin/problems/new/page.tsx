"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import AdminProblemForm, { ProblemDraft } from "@/components/AdminProblemForm";

const emptyDraft: ProblemDraft = {
  title: "",
  description: "",
  input_desc: "",
  output_desc: "",
  tier: 1,
  source: "",
  step_group: "",
  step_order: 0,
  sample_input: "",
  sample_output: "",
  image_url: "",
  tags: [],
  subtasks: [],
};

export default function NewProblemPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user?.isAdmin) {
    return <div className="card p-10 text-center text-sm text-ink-faint">불러오는 중…</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/admin" className="hover:text-accent hover:underline">
          관리자
        </Link>
        <span>/</span>
        <span className="text-ink-soft">새 문제</span>
      </div>
      <h1 className="text-2xl font-bold text-ink">새 문제 만들기</h1>
      <AdminProblemForm mode="new" initial={emptyDraft} initialCases={[]} />
    </div>
  );
}
