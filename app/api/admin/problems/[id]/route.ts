import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { runGolfScript } from "@/lib/golfscript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

interface CaseInput {
  stdin: string;
  stdout: string;
  is_hidden?: boolean;
}

// GET /api/admin/problems/[id] — full problem incl. test cases
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "잘못된 ID." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data: problem } = await admin
    .from("problems")
    .select(
      "id, title, description, input_desc, output_desc, tier, source, step_group, step_order, sample_input, sample_output, image_url",
    )
    .eq("id", id)
    .maybeSingle();
  if (!problem) {
    return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
  }
  const { data: cases } = await admin
    .from("test_cases")
    .select("id, stdin, stdout, is_hidden")
    .eq("problem_id", id)
    .order("id", { ascending: true });

  return NextResponse.json({ problem, cases: cases ?? [] });
}

// PATCH /api/admin/problems/[id] — update problem + replace test cases
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "잘못된 ID." }, { status: 400 });
  }

  let body: Record<string, unknown> & {
    cases?: CaseInput[];
    solution?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  }

  const cases = Array.isArray(body.cases) ? body.cases : null;
  const solution = String(body.solution ?? "").trim();

  // Validate cases against the reference solution if provided.
  if (solution && cases && cases.length > 0) {
    for (const [i, c] of cases.entries()) {
      const r = runGolfScript(solution, c.stdin ?? "", {
        timeoutMs: 3000,
        maxSteps: 5_000_000,
      });
      if (r.error || normalize(r.stdout) !== normalize(c.stdout ?? "")) {
        return NextResponse.json(
          {
            error: `정답 코드가 ${i + 1}번 케이스를 통과하지 못합니다.`,
          },
          { status: 400 },
        );
      }
    }
  }

  const admin = getSupabaseAdminClient();
  const { error: updErr } = await admin
    .from("problems")
    .update({
      title,
      description: String(body.description ?? ""),
      input_desc: String(body.input_desc ?? ""),
      output_desc: String(body.output_desc ?? ""),
      tier: Number(body.tier) || 0,
      source: String(body.source ?? ""),
      step_group: String(body.step_group ?? ""),
      step_order: Number(body.step_order) || 0,
      sample_input: String(body.sample_input ?? ""),
      sample_output: String(body.sample_output ?? ""),
      image_url: String(body.image_url ?? ""),
    })
    .eq("id", id);

  if (updErr) {
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }

  // Replace test cases when provided.
  if (cases) {
    await admin.from("test_cases").delete().eq("problem_id", id);
    if (cases.length > 0) {
      const rows = cases.map((c) => ({
        problem_id: id,
        stdin: c.stdin ?? "",
        stdout: c.stdout ?? "",
        is_hidden: !!c.is_hidden,
      }));
      const { error: caseErr } = await admin.from("test_cases").insert(rows);
      if (caseErr) {
        return NextResponse.json(
          { error: "문제는 수정됐지만 테스트 케이스 저장에 실패했습니다." },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/problems/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "잘못된 ID." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  // test_cases / submissions cascade via FK.
  const { error } = await admin.from("problems").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
