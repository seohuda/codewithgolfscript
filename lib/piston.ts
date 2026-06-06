import { Verdict } from "./types";
import { runGolfScript } from "./golfscript";

/**
 * GolfScript execution layer.
 *
 * Originally this called the public Piston API, but that endpoint became
 * whitelist-only (2026-02-15) and is no longer publicly usable. Execution
 * now runs on a self-contained in-process GolfScript interpreter
 * (`lib/golfscript.ts`) — no external backend, no rate limits.
 */

// Per-case execution limits for the in-process interpreter.
const RUN_TIMEOUT_MS = 3000;
const MAX_STEPS = 5_000_000;

export interface RunCaseResult {
  verdict: Verdict;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

/**
 * Executes a single GolfScript program against one stdin payload and
 * maps the outcome onto a normalized result.
 *
 * Verdict at this stage (correctness compared by the caller):
 *  - TLE: interpreter hit the time/step limit
 *  - RE : interpreter raised a runtime error (e.g. stack underflow)
 *  - AC : clean run (the caller still compares stdout for WA/AC)
 */
export async function runGolfScriptCase(
  code: string,
  stdin: string,
): Promise<RunCaseResult> {
  let result: { stdout: string; error: string | null };

  try {
    result = runGolfScript(code, stdin, {
      timeoutMs: RUN_TIMEOUT_MS,
      maxSteps: MAX_STEPS,
    });
  } catch (err) {
    return {
      verdict: "RE",
      stdout: "",
      stderr: err instanceof Error ? err.message : String(err),
      timedOut: false,
    };
  }

  if (result.error === "TLE") {
    return {
      verdict: "TLE",
      stdout: result.stdout,
      stderr: "Time limit exceeded.",
      timedOut: true,
    };
  }

  if (result.error) {
    return {
      verdict: "RE",
      stdout: result.stdout,
      stderr: result.error,
      timedOut: false,
    };
  }

  return {
    verdict: "AC",
    stdout: result.stdout,
    stderr: "",
    timedOut: false,
  };
}
