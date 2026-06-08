/**
 * Generates a password hash compatible with lib/auth.ts (scrypt).
 *
 * Usage:
 *   node_modules/.bin/tsx scripts/hash-password.ts '새비밀번호'
 *
 * Then copy the printed hash into Supabase:
 *   update public.users set password_hash = '<해시>' where username = 'admin';
 */
import { hashPassword } from "../lib/auth";

const pw = process.argv[2];
if (!pw) {
  console.error("사용법: tsx scripts/hash-password.ts '새비밀번호'");
  process.exit(1);
}
if (pw.length < 6) {
  console.error("비밀번호는 6자 이상이어야 합니다.");
  process.exit(1);
}

const hash = hashPassword(pw);
console.log("\n비밀번호 해시 (이 값을 password_hash 에 넣으세요):\n");
console.log(hash);
console.log("\nSupabase SQL Editor 실행 예시:");
console.log(
  `update public.users set password_hash = '${hash}' where username = 'admin';\n`,
);
