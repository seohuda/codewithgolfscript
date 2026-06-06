import { Verdict } from "./types";

/**
 * Piston public execution API integration.
 *
 * Docs: https://github.com/engineer-man/piston
 * Public endpoint: https://emkc.org/api/v2/execute
 */

const PISTON_API_URL =
  process.env.PISTON_API_URL ?? "https://emkc.org/api/v2/execute";

// GolfScript is available on the public Piston instance.
const GOLFSCRIPT_LANGUAGE = "golfscript";
const GOLFSCRIPT_VERSION = "*";

// Per-case execution limits.
const RUN_TIMEOUT_MS = 5000;
const COMPILE_TIMEOUT_MS = 10000;

export interface PistonRunStage {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
}

export interface PistonExecuteResponse {
  language: string;
  version: string;
  run: PistonRunStage;
  compile?: PistonRunStage;
  message?: string;
}

export interface RunCaseResult {
  verdict: Verdict;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

/**
 * Executes a single GolfScript program against one stdin payload via
 * the Piston API and maps the response onto a normalized result.
 *
 * Verdict mapping at this stage (correctness compared by the caller):
 *  - TLE: signal SIGKILL / non-zero timeout signal
 *  - RE : runtime stage produced stderr or a non-zero exit code
 *  - AC : clean run (the caller still compares stdout for WA/AC)
 */
export async function runGolfScriptCase(
  code: string,
  stdin: string,
): Promise<RunCaseResult> {
  let response: Response;

  try {
    response = await fetch(PISTON_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: GOLFSCRIPT_LANGUAGE,
        version: GOLFSCRIPT_VERSION,
        files: [{ name: "main.gs", content: code }],
        stdin,
        compile_timeout: COMPILE_TIMEOUT_MS,
        run_timeout: RUN_TIMEOUT_MS,
      }),
      cache: "no-store",
    });
  } catch (err) {
    return {
      verdict: "RE",
      stdout: "",
      stderr: `Network error contacting execution backend: ${String(err)}`,
      timedOut: false,
    };
  }

  if (response.status === 429) {
    // Rate limited by the public Piston instance.
    return {
      verdict: "RE",
      stdout: "",
      stderr: "Execution backend rate limit reached. Please retry shortly.",
      timedOut: false,
    };
  }

  if (!response.ok) {
    return {
      verdict: "RE",
      stdout: "",
      stderr: `Execution backend returned HTTP ${response.status}.`,
      timedOut: false,
    };
  }

  let data: PistonExecuteResponse;
  try {
    data = (await response.json()) as PistonExecuteResponse;
  } catch (err) {
    return {
      verdict: "RE",
      stdout: "",
      stderr: `Failed to parse execution backend response: ${String(err)}`,
      timedOut: false,
    };
  }

  // Compilation / preparation failures (rare for GolfScript).
  if (data.compile && data.compile.code !== 0 && data.compile.code !== null) {
    return {
      verdict: "CE",
      stdout: data.compile.stdout ?? "",
      stderr: data.compile.stderr ?? "Compilation failed.",
      timedOut: false,
    };
  }

  const run = data.run;
  const signal = run?.signal ?? null;
  const timedOut = signal === "SIGKILL" || signal === "SIGTERM";

  if (timedOut) {
    return {
      verdict: "TLE",
      stdout: run?.stdout ?? "",
      stderr: run?.stderr ?? "",
      timedOut: true,
    };
  }

  const exitCode = run?.code ?? 0;
  if (exitCode !== 0 || (run?.stderr ?? "").trim().length > 0) {
    return {
      verdict: "RE",
      stdout: run?.stdout ?? "",
      stderr: run?.stderr ?? `Process exited with code ${exitCode}.`,
      timedOut: false,
    };
  }

  return {
    verdict: "AC",
    stdout: run?.stdout ?? "",
    stderr: run?.stderr ?? "",
    timedOut: false,
  };
}
