"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface TestCaseDraft {
  stdin: string;
  stdout: string;
  is_hidden: boolean;
}

export interface ProblemDraft {
  title: string;
  description: string;
  input_desc: string;
  output_desc: string;
  tier: number;
  source: string;
  step_group: string;
  step_order: number;
  sample_input: string;
  sample_output: string;
}

interface Props {
  mode: "new" | "edit";
  problemId?: number;
  initial: ProblemDraft;
  initialCases: TestCaseDraft[];
}

const empty: TestCaseDraft = { stdin: "", stdout: "", is_hidden: false };

export default function AdminProblemForm({
  mode,
  problemId,
  initial,
  initialCases,
}: Props) {
  const router = useRouter();
  const [p, setP] = useState<ProblemDraft>(initial);
  const [cases, setCases] = useState<TestCaseDraft[]>(
    initialCases.length ? initialCases : [{ ...empty }],
  );
  const [solution, setSolution] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProblemDraft>(k: K, v: ProblemDraft[K]) {
    setP((prev) => ({ ...prev, [k]: v }));
  }
  function setCase(i: number, patch: Partial<TestCaseDraft>) {
    setCases((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addCase() {
    setCases((prev) => [...prev, { ...empty }]);
  }
  function removeCase(i: number) {
    setCases((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setError(null);
    if (!p.title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...p, solution, cases };
      const url =
        mode === "new"
          ? "/api/admin/problems"
          : `/api/admin/problems/${problemId}`;
      const res = await fetch(url, {
        method: mode === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
          문제 정보
        </h2>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">제목</label>
          <input
            value={p.title}
            onChange={(e) => set("title", e.target.value)}
            className="field"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">티어 (0~30)</label>
            <input
              type="number"
              min={0}
              max={30}
              value={p.tier}
              onChange={(e) => set("tier", Number(e.target.value))}
              className="field"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">단계 순서</label>
            <input
              type="number"
              value={p.step_order}
              onChange={(e) => set("step_order", Number(e.target.value))}
              className="field"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">단계 그룹</label>
            <input
              value={p.step_group}
              onChange={(e) => set("step_group", e.target.value)}
              placeholder="예: 입출력과 기본 연산"
              className="field"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">출처</label>
            <input
              value={p.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="자체 제작"
              className="field"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">설명</label>
          <textarea
            value={p.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="field resize-y"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">입력 설명</label>
            <textarea
              value={p.input_desc}
              onChange={(e) => set("input_desc", e.target.value)}
              rows={2}
              className="field resize-y"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">출력 설명</label>
            <textarea
              value={p.output_desc}
              onChange={(e) => set("output_desc", e.target.value)}
              rows={2}
              className="field resize-y"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">예제 입력</label>
            <textarea
              value={p.sample_input}
              onChange={(e) => set("sample_input", e.target.value)}
              rows={2}
              className="field resize-y font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">예제 출력</label>
            <textarea
              value={p.sample_output}
              onChange={(e) => set("sample_output", e.target.value)}
              rows={2}
              className="field resize-y font-mono"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
            테스트 케이스
          </h2>
          <button type="button" onClick={addCase} className="btn-outlined px-3 py-1.5 text-xs">
            케이스 추가
          </button>
        </div>
        {cases.map((c, i) => (
          <div key={i} className="border border-surface-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs text-ink-faint">#{i + 1}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={c.is_hidden}
                    onChange={(e) => setCase(i, { is_hidden: e.target.checked })}
                    className="h-4 w-4 accent-accent"
                  />
                  히든
                </label>
                <button
                  type="button"
                  onClick={() => removeCase(i)}
                  className="text-xs text-danger hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <textarea
                value={c.stdin}
                onChange={(e) => setCase(i, { stdin: e.target.value })}
                rows={2}
                placeholder="입력 (stdin)"
                className="field resize-y font-mono text-xs"
              />
              <textarea
                value={c.stdout}
                onChange={(e) => setCase(i, { stdout: e.target.value })}
                rows={2}
                placeholder="기대 출력 (stdout)"
                className="field resize-y font-mono text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-2 p-6">
        <label className="text-sm font-medium text-ink">
          정답 코드 (선택) — 입력 시 모든 케이스를 검증합니다
        </label>
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          rows={2}
          placeholder="예: ~+"
          className="field resize-y font-mono"
        />
        <p className="text-xs text-ink-faint">
          정답 코드를 입력하면 저장 전에 모든 테스트 케이스가 통과하는지
          확인합니다. 비워 두면 검증 없이 저장됩니다.
        </p>
      </div>

      {error && (
        <p className="bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-filled">
          {saving ? "저장 중…" : mode === "new" ? "문제 생성" : "수정 저장"}
        </button>
        <button onClick={() => router.push("/admin")} className="btn-outlined">
          취소
        </button>
      </div>
    </div>
  );
}
