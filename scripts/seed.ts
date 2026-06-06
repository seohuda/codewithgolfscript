import { createClient } from "@supabase/supabase-js";
import { runGolfScript } from "../lib/golfscript";
import { getTierInfo } from "../lib/tiers";
import P from "./problems.data";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

async function main() {
  // ---- 1. Verify every reference solution ----------------------------
  console.log("Verifying reference solutions...");
  let verifyFailed = 0;
  for (const prob of P) {
    for (const c of prob.cases) {
      const r = runGolfScript(prob.solution, c.stdin, {
        timeoutMs: 3000,
        maxSteps: 5_000_000,
      });
      if (r.error || normalize(r.stdout) !== normalize(c.stdout)) {
        verifyFailed++;
        console.error(
          `  FAIL [${prob.title}] stdin=${JSON.stringify(c.stdin)} got=${JSON.stringify(
            normalize(r.stdout),
          )} exp=${JSON.stringify(normalize(c.stdout))} err=${r.error}`,
        );
      }
    }
  }
  if (verifyFailed > 0) {
    console.error(`\n${verifyFailed} case(s) failed verification. Aborting seed.`);
    process.exit(1);
  }
  console.log(`  OK: ${P.length} problems, all cases pass.\n`);

  // ---- 2. Reset existing problems & test cases -----------------------
  console.log("Clearing existing problems and test cases...");
  // Deleting problems cascades to test_cases and submissions.
  await admin.from("problems").delete().neq("id", -1);

  // ---- 3. Insert problems + test cases -------------------------------
  console.log("Inserting problems...");
  const solutionsDir = path.resolve(process.cwd(), "solutions");
  if (!fs.existsSync(solutionsDir)) fs.mkdirSync(solutionsDir, { recursive: true });

  const answerIndex: string[] = [
    "# 정답 모음 (비공개)",
    "",
    "| # | 제목 | 티어 | 바이트 | 정답 |",
    "| --- | --- | --- | --- | --- |",
  ];

  let number = 1;
  for (const prob of P) {
    const { data: inserted, error: insErr } = await admin
      .from("problems")
      .insert({
        title: prob.title,
        description: prob.description,
        input_desc: prob.inputDesc,
        output_desc: prob.outputDesc,
        tier: prob.tier,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      console.error(`  Insert failed [${prob.title}]: ${insErr?.message}`);
      process.exit(1);
    }

    const problemId = inserted.id as number;

    const caseRows = prob.cases.map((c) => ({
      problem_id: problemId,
      stdin: c.stdin,
      stdout: c.stdout,
      is_hidden: !!c.hidden,
    }));
    const { error: caseErr } = await admin.from("test_cases").insert(caseRows);
    if (caseErr) {
      console.error(`  Test case insert failed [${prob.title}]: ${caseErr.message}`);
      process.exit(1);
    }

    // Save private answer file.
    const bytes = Buffer.byteLength(prob.solution, "utf8");
    const tierName = getTierInfo(prob.tier).nameKo;
    const fileName = `${String(number).padStart(3, "0")}_${prob.title}.md`;
    const content = [
      `# ${prob.title}`,
      ``,
      `- 문제 ID: ${problemId}`,
      `- 티어: ${tierName} (tier ${prob.tier})`,
      `- 바이트: ${bytes}`,
      ``,
      `## 설명`,
      prob.description,
      ``,
      `## 정답 코드`,
      "```",
      prob.solution,
      "```",
      ``,
      `## 테스트 케이스`,
      ...prob.cases.map(
        (c) =>
          `- ${c.hidden ? "[히든] " : ""}입력 \`${c.stdin}\` → 출력 \`${c.stdout}\``,
      ),
      ``,
    ].join("\n");
    fs.writeFileSync(path.join(solutionsDir, fileName), content, "utf8");

    answerIndex.push(
      `| ${number} | ${prob.title} | ${tierName} | ${bytes} | \`${prob.solution}\` |`,
    );

    console.log(`  [${number}/${P.length}] ${prob.title} (${tierName}, ${bytes}B)`);
    number++;
  }

  fs.writeFileSync(
    path.join(solutionsDir, "INDEX.md"),
    answerIndex.join("\n") + "\n",
    "utf8",
  );

  console.log(`\nDone. ${P.length} problems seeded.`);
  console.log(`Private answers written to: ${solutionsDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
