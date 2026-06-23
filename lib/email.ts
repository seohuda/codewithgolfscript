/**
 * Resend email sender (server-only).
 *
 * Uses the Resend REST API directly (no SDK needed).
 *
 * Required env vars:
 *  - RESEND_API_KEY            API key from resend.com
 *  - EMAIL_FROM                verified sender, e.g. "CODE WITH GOLF <no-reply@golfscript.xyz>"
 *  - NEXT_PUBLIC_SITE_URL      base URL for links (e.g. https://golfscript.xyz)
 */

import { SITE_NAME, SITE_SUBTITLE, SITE_URL } from "@/lib/site";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    SITE_URL
  );
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  // Fall back to a safe sender on the verified domain if EMAIL_FROM is
  // missing or got mangled in the environment (spaces/angle brackets can
  // break env var delivery on some hosts).
  const from = process.env.EMAIL_FROM || "no-reply@golfscript.xyz";
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${detail}`);
  }
}

function layout(title: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#181818">
    <h1 style="font-size:18px;font-weight:800;letter-spacing:-.01em">${SITE_NAME}</h1>
    <p style="margin-top:4px;font-size:12px;color:#888">${SITE_SUBTITLE}</p>
    <h2 style="font-size:16px;margin-top:24px">${title}</h2>
    ${bodyHtml}
    <p style="margin-top:32px;font-size:12px;color:#888">본 메일은 발신 전용입니다.</p>
  </div>`;
}

export async function sendVerificationEmail(to: string, link: string) {
  const html = layout(
    "이메일 인증",
    `<p style="font-size:14px;line-height:1.6">아래 버튼을 눌러 이메일 인증을 완료해 주세요. 링크는 24시간 동안 유효합니다.</p>
     <p style="margin:20px 0"><a href="${link}" style="display:inline-block;background:#181818;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700">이메일 인증하기</a></p>
     <p style="font-size:12px;color:#888;word-break:break-all">${link}</p>`,
  );
  const text = `이메일 인증을 완료하려면 아래 링크를 여세요 (24시간 유효):\n${link}`;
  await sendEmail(to, `[${SITE_NAME}] 이메일 인증`, html, text);
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const html = layout(
    "비밀번호 재설정",
    `<p style="font-size:14px;line-height:1.6">아래 버튼을 눌러 비밀번호를 재설정하세요. 링크는 1시간 동안 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
     <p style="margin:20px 0"><a href="${link}" style="display:inline-block;background:#181818;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700">비밀번호 재설정</a></p>
     <p style="font-size:12px;color:#888;word-break:break-all">${link}</p>`,
  );
  const text = `비밀번호를 재설정하려면 아래 링크를 여세요 (1시간 유효):\n${link}`;
  await sendEmail(to, `[${SITE_NAME}] 비밀번호 재설정`, html, text);
}
