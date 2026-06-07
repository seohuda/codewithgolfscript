import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { runGolfScriptCase } from "@/lib/piston";
import { byteLength } from "@/lib/bytes";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import {
  CaseResult,
  SubmitRequestBody,
  SubmitResponse,
  TestCase,
  Verdict,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verdict precedence when aggregating across all test cases.
// Lower number = reported first when multiple failures occur.
const VERDICT_PRIORITY: Record<Verdict, number> = {
  CE: 0,
  RE: 1,
  TLE: 2,
  WA: 3,
  AC: 4,
  PENDING: 5,
};

/**
 * Normalizes program output for comparison:
 *  - normalize CRLF / CR to LF
 *  - trim leading/trailing whitespace (per requirements)
 */
function normalizeOutput(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function badRequest(message: string): NextResponse<SubmitResponse> {
  return NextResponse.json<SubmitResponse>(
    {
      submissionId: null,
      verdict: "RE",
      bytes: 0,
      passed: 0,
      total: 0,
      results: [],
      message,
    },
    { status: 400 },
  );
}

export async function POST(req: NextRequest) {
  // --- Require a logged-in session ------------------------------------
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json<SubmitResponse>(
      {
        submissionId: null,
        verdict: "RE",
        bytes: 0,
        passed: 0,
        total: 0,
        results: [],
        message: "로그인이 필요합니다.",
      },
      { status: 401 },
    );
  }

  let body: SubmitRequestBody;
  try {
    body = (await req.json()) as SubmitRequestBody;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const problemId = Number(body?.problemId);
  const code = typeof body?.code === "string" ? body.code : "";

  if (!Number.isFinite(problemId) || problemId <= 0) {
    return badRequest("A valid problemId is required.");
  }
  if (!code) {
    return badRequest("제출할 코드를 입력해 주세요.");
  }
  if (code.length > 10000) {
    return badRequest("코드가 너무 깁니다.");
  }

  // Exact UTF-8 byte size — this is the ranking metric.
  const bytes = byteLength(code);

  const admin = getSupabaseAdminClient();

  // --- Rate limiting: block abusive rapid submissions -----------------
  {
    // Existing ban still active?
    const { data: u } = await admin
      .from("users")
      .select("banned_until")
      .eq("id", session.userId)
      .maybeSingle();
    if (u?.banned_until && new Date(u.banned_until) > new Date()) {
      const mins = Math.ceil(
        (new Date(u.banned_until).getTime() - Date.now()) / 60000,
      );
      return NextResponse.json<SubmitResponse>(
        {
          submissionId: null,
          verdict: "RE",
          bytes: 0,
          passed: 0,
          total: 0,
          results: [],
          message: `너무 빠른 제출로 일시 정지되었습니다. ${mins}분 후 다시 시도해 주세요.`,
        },
        { status: 429 },
      );
    }

    // More than 10 submissions in the last 20 seconds → 5-minute ban.
    const since = new Date(Date.now() - 20_000).toISOString();
    const { count } = await admin
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId)
      .gte("created_at", since);
    if ((count ?? 0) >= 10) {
      const until = new Date(Date.now() + 5 * 60_000).toISOString();
      await admin
        .from("users")
        .update({ banned_until: until })
        .eq("id", session.userId);
      return NextResponse.json<SubmitResponse>(
        {
          submissionId: null,
          verdict: "RE",
          bytes: 0,
          passed: 0,
          total: 0,
          results: [],
          message: "제출이 너무 잦습니다. 5분간 제출이 제한됩니다.",
        },
        { status: 429 },
      );
    }
  }

  // --- User comes from the verified session ---------------------------
  const userId: string = session.userId;

  // --- Verify the problem exists --------------------------------------
  {
    const { data: problem, error: probErr } = await admin
      .from("problems")
      .select("id")
      .eq("id", problemId)
      .maybeSingle();

    if (probErr) {
      return NextResponse.json<SubmitResponse>(
        {
          submissionId: null,
          verdict: "RE",
          bytes,
          passed: 0,
          total: 0,
          results: [],
          message: "데이터베이스 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }
    if (!problem) {
      return badRequest(`Problem ${problemId} does not exist.`);
    }
  }

  // --- Fetch ALL test cases (server-only, bypasses RLS) ---------------
  const { data: cases, error: casesErr } = await admin
    .from("test_cases")
    .select("id, problem_id, stdin, stdout, is_hidden, created_at")
    .eq("problem_id", problemId)
    .order("id", { ascending: true });

  if (casesErr) {
    return NextResponse.json<SubmitResponse>(
      {
        submissionId: null,
        verdict: "RE",
        bytes,
        passed: 0,
        total: 0,
        results: [],
        message: "데이터베이스 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }

  const testCases = (cases ?? []) as TestCase[];
  const total = testCases.length;

  if (total === 0) {
    return NextResponse.json<SubmitResponse>(
      {
        submissionId: null,
        verdict: "RE",
        bytes,
        passed: 0,
        total: 0,
        results: [],
        message: "This problem has no test cases configured.",
      },
      { status: 500 },
    );
  }

  // --- Execute each case (in parallel) via Piston ---------------------
  const executions = await Promise.all(
    testCases.map(async (tc, index) => {
      const run = await runGolfScriptCase(code, tc.stdin);

      let verdict: Verdict = run.verdict;
      if (verdict === "AC") {
        // Clean execution: now compare trimmed output for WA/AC.
        const expected = normalizeOutput(tc.stdout);
        const actual = normalizeOutput(run.stdout);
        verdict = expected === actual ? "AC" : "WA";
      }

      const result: CaseResult = {
        index,
        hidden: tc.is_hidden,
        verdict,
      };
      return result;
    }),
  );

  // --- Aggregate final verdict ----------------------------------------
  const passed = executions.filter((r) => r.verdict === "AC").length;

  let finalVerdict: Verdict = "AC";
  for (const r of executions) {
    if (VERDICT_PRIORITY[r.verdict] < VERDICT_PRIORITY[finalVerdict]) {
      finalVerdict = r.verdict;
    }
  }
  if (passed === total) {
    finalVerdict = "AC";
  }

  // --- Persist the submission -----------------------------------------
  const { data: submission, error: subErr } = await admin
    .from("submissions")
    .insert({
      user_id: userId,
      problem_id: problemId,
      code,
      bytes,
      verdict: finalVerdict,
    })
    .select("id")
    .single();

  if (subErr || !submission) {
    return NextResponse.json<SubmitResponse>(
      {
        submissionId: null,
        verdict: finalVerdict,
        bytes,
        passed,
        total,
        results: executions,
        message: "제출 저장에 실패했습니다.",
      },
      { status: 500 },
    );
  }

  // --- Compute best-bytes record for AC submissions ------------------
  let bestBytes: number | null = null;
  let isRecord = false;
  if (finalVerdict === "AC") {
    const { data: best } = await admin
      .from("submissions")
      .select("bytes")
      .eq("problem_id", problemId)
      .eq("verdict", "AC")
      .order("bytes", { ascending: true })
      .limit(1)
      .maybeSingle();
    bestBytes = (best?.bytes as number) ?? bytes;
    // A new record if this submission's bytes are the global minimum and
    // strictly fewer than any earlier accepted submission by anyone else.
    const { data: prevBest } = await admin
      .from("submissions")
      .select("bytes")
      .eq("problem_id", problemId)
      .eq("verdict", "AC")
      .neq("id", submission.id)
      .order("bytes", { ascending: true })
      .limit(1)
      .maybeSingle();
    const prev = prevBest?.bytes as number | undefined;
    isRecord = prev === undefined || bytes < prev;
    if (isRecord) bestBytes = bytes;
  }

  // IMPORTANT: `results` only ever exposes index/hidden/verdict.
  // Hidden test case stdin/stdout are NEVER returned to the client.
  const responseBody: SubmitResponse = {
    submissionId: submission.id as string,
    verdict: finalVerdict,
    bytes,
    passed,
    total,
    results: executions,
    bestBytes,
    isRecord,
  };

  return NextResponse.json<SubmitResponse>(responseBody, { status: 200 });
}
