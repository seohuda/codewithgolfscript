import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { runGolfScriptCase } from "@/lib/piston";
import { byteLength } from "@/lib/bytes";
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
  let body: SubmitRequestBody;
  try {
    body = (await req.json()) as SubmitRequestBody;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const problemId = Number(body?.problemId);
  const username = (body?.username ?? "").trim();
  const code = typeof body?.code === "string" ? body.code : "";

  if (!Number.isFinite(problemId) || problemId <= 0) {
    return badRequest("A valid problemId is required.");
  }
  if (!username) {
    return badRequest("A username is required.");
  }
  if (username.length > 64) {
    return badRequest("Username must be 64 characters or fewer.");
  }
  if (!code) {
    return badRequest("Submitted code cannot be empty.");
  }
  if (code.length > 100000) {
    return badRequest("Submitted code is too large.");
  }

  // Exact UTF-8 byte size — this is the ranking metric.
  const bytes = byteLength(code);

  const admin = getSupabaseAdminClient();

  // --- Resolve / create the user --------------------------------------
  let userId: string;
  {
    const { data: existing, error: selErr } = await admin
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json<SubmitResponse>(
        {
          submissionId: null,
          verdict: "RE",
          bytes,
          passed: 0,
          total: 0,
          results: [],
          message: `Database error (user lookup): ${selErr.message}`,
        },
        { status: 500 },
      );
    }

    if (existing?.id) {
      userId = existing.id as string;
    } else {
      const { data: created, error: insErr } = await admin
        .from("users")
        .insert({ username })
        .select("id")
        .single();

      if (insErr || !created) {
        return NextResponse.json<SubmitResponse>(
          {
            submissionId: null,
            verdict: "RE",
            bytes,
            passed: 0,
            total: 0,
            results: [],
            message: `Database error (user create): ${insErr?.message ?? "unknown"}`,
          },
          { status: 500 },
        );
      }
      userId = created.id as string;
    }
  }

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
          message: `Database error (problem lookup): ${probErr.message}`,
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
        message: `Database error (test cases): ${casesErr.message}`,
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
        message: `Database error (submission insert): ${subErr?.message ?? "unknown"}`,
      },
      { status: 500 },
    );
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
  };

  return NextResponse.json<SubmitResponse>(responseBody, { status: 200 });
}
