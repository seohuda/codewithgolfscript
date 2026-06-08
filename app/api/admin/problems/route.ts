import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { runGolfScript } from "@/lib/golfscript";
import { sanitizeUrl } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

interface CaseInput {
  stdin: string;
  stdout: string;
  is_hidden?: boolean;
  subtask?: number;
}

interface SubtaskInput {
  no?: number;
  points?: number;
  desc?: string;
}

interface ProblemInput {
  title?: string;
  description?: string;
  input_desc?: string;
  output_desc?: string;
  tier?: number;
  source?: string;
  step_group?: string;
  step_order?: number;
  sample_input?: string;
  sample_output?: string;
  image_url?: string;
  solution?: string; // optional reference solution to validate cases
  cases?: CaseInput[];
  tags?: string[];
  subtasks?: SubtaskInput[];
}

// Normalize a subtask list: valid numbered entries with points/desc.
function cleanSubtasks(raw: unknown): { no: number; points: number; desc: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { no: number; points: number; desc: string }[] = [];
  for (const s of raw) {
    const o = s as SubtaskInput;
    const no = Number(o?.no);
    const points = Number(o?.points);
    if (!Number.isFinite(no) || no <= 0) continue;
    if (!Number.isFinite(points) || points < 0) continue;
    out.push({
      no,
      points: Math.trunc(points),
      desc: String(o?.desc ?? "").slice(0, 200),
    });
    if (out.length >= 20) break;
  }
  return out;
}

// Normalize a tag list: trim, drop empties, dedupe, cap length & count.
function cleanTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const t of raw) {
    const s = String(t ?? "").trim().slice(0, 20);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= 10) break;
  }
  return out;
}

// GET /api/admin/problems — list all problems (admin)
export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("problems")
    .select("id, title, tier, step_group")
    .order("id", { ascending: false })
    .range(0, 9999);
  if (error) {
    return NextResponse.json({ error: "불러오지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ problems: data ?? [] });
}

// POST /api/admin/problems — create a problem (+ optional cases)
export async function POST(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let body: ProblemInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  }

  const cases = Array.isArray(body.cases) ? body.cases : [];

  // If a reference solution is given, validate every case against it.
  const solution = (body.solution ?? "").trim();
  if (solution && cases.length > 0) {
    for (const [i, c] of cases.entries()) {
      const r = runGolfScript(solution, c.stdin ?? "", {
        timeoutMs: 3000,
        maxSteps: 5_000_000,
      });
      if (r.error || normalize(r.stdout) !== normalize(c.stdout ?? "")) {
        return NextResponse.json(
          {
            error: `정답 코드가 ${i + 1}번 케이스를 통과하지 못합니다. (출력: ${normalize(
              r.stdout,
            )}${r.error ? `, 오류: ${r.error}` : ""})`,
          },
          { status: 400 },
        );
      }
    }
  }

  const admin = getSupabaseAdminClient();
  const { data: created, error: insErr } = await admin
    .from("problems")
    .insert({
      title,
      description: body.description ?? "",
      input_desc: body.input_desc ?? "",
      output_desc: body.output_desc ?? "",
      tier: Number(body.tier) || 0,
      source: body.source ?? "",
      step_group: body.step_group ?? "",
      step_order: Number(body.step_order) || 0,
      sample_input: body.sample_input ?? "",
      sample_output: body.sample_output ?? "",
      image_url: sanitizeUrl(body.image_url),
      tags: cleanTags(body.tags),
      subtasks: cleanSubtasks(body.subtasks),
    })
    .select("id")
    .single();

  if (insErr || !created) {
    return NextResponse.json({ error: "생성에 실패했습니다." }, { status: 500 });
  }

  const problemId = created.id as number;
  if (cases.length > 0) {
    const rows = cases.map((c) => ({
      problem_id: problemId,
      stdin: c.stdin ?? "",
      stdout: c.stdout ?? "",
      is_hidden: !!c.is_hidden,
      subtask: Number(c.subtask) || 0,
    }));
    const { error: caseErr } = await admin.from("test_cases").insert(rows);
    if (caseErr) {
      return NextResponse.json(
        { error: "문제는 생성됐지만 테스트 케이스 저장에 실패했습니다." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ id: problemId });
}
