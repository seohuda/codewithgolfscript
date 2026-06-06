import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "../lib/auth";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing env (.env.local).");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Usage: npx tsx scripts/make-admin.ts <username> <password>
// Defaults to admin / golfadmin!2026 if not provided.
const username = process.argv[2] ?? "admin";
const password = process.argv[3] ?? "golfadmin!2026";

async function main() {
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (existing) {
    // Promote + reset password.
    const { error } = await admin
      .from("users")
      .update({ is_admin: true, password_hash: hashPassword(password) })
      .eq("id", existing.id);
    if (error) {
      console.error("Promote failed:", error.message);
      process.exit(1);
    }
    console.log(`기존 계정 "${username}" 을(를) 관리자로 승격했습니다.`);
  } else {
    const { error } = await admin.from("users").insert({
      username,
      password_hash: hashPassword(password),
      is_admin: true,
    });
    if (error) {
      console.error("Create failed:", error.message);
      process.exit(1);
    }
    console.log(`관리자 계정 "${username}" 을(를) 생성했습니다.`);
  }
  console.log(`  아이디: ${username}`);
  console.log(`  비밀번호: ${password}`);
  console.log("  이 계정의 제출은 리더보드 순위에서 제외됩니다.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
