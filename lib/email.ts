import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

/**
 * AWS SES email sender (server-only).
 *
 * Required env vars:
 *  - SES_REGION                (e.g. ap-northeast-2)
 *  - SES_ACCESS_KEY_ID
 *  - SES_SECRET_ACCESS_KEY
 *  - SES_FROM_EMAIL            verified sender address/domain in SES
 *  - NEXT_PUBLIC_SITE_URL      base URL for links (e.g. https://...amplifyapp.com)
 */

function getClient(): SESClient {
  const region = process.env.SES_REGION;
  const accessKeyId = process.env.SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("AWS SES credentials are not configured.");
  }
  return new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) throw new Error("SES_FROM_EMAIL is not configured.");

  const client = getClient();
  await client.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: { Data: text, Charset: "UTF-8" },
        },
      },
    }),
  );
}

function layout(title: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#181818">
    <h1 style="font-size:18px;font-weight:800;letter-spacing:-.01em">CODE WITH GOLF<span style="color:#ff3b14">SCRIPT</span></h1>
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
  await sendEmail(to, "[CODE WITH GOLFSCRIPT] 이메일 인증", html, text);
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const html = layout(
    "비밀번호 재설정",
    `<p style="font-size:14px;line-height:1.6">아래 버튼을 눌러 비밀번호를 재설정하세요. 링크는 1시간 동안 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
     <p style="margin:20px 0"><a href="${link}" style="display:inline-block;background:#181818;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700">비밀번호 재설정</a></p>
     <p style="font-size:12px;color:#888;word-break:break-all">${link}</p>`,
  );
  const text = `비밀번호를 재설정하려면 아래 링크를 여세요 (1시간 유효):\n${link}`;
  await sendEmail(to, "[CODE WITH GOLFSCRIPT] 비밀번호 재설정", html, text);
}
