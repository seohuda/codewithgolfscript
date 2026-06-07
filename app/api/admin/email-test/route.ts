import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET  /api/admin/email-test                  — show email config status
// POST /api/admin/email-test   { to }         — attempt a real send
// Admin-only. Never reveals secret values, only presence/length/shape.
export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY ?? "";
  const from = process.env.EMAIL_FROM ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return NextResponse.json({
    config: {
      RESEND_API_KEY: {
        present: !!apiKey,
        length: apiKey.length,
        startsWithRe: apiKey.startsWith("re_"),
      },
      EMAIL_FROM: {
        present: !!from,
        value: from, // not secret; helps confirm the sender/domain
        hasAngle: from.includes("<") && from.includes(">"),
        domain: (from.match(/@([^>\s]+)/)?.[1]) ?? null,
      },
      NEXT_PUBLIC_SITE_URL: { present: !!siteUrl, value: siteUrl },
      SESSION_SECRET: { present: !!process.env.SESSION_SECRET },
    },
  });
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let body: { to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const to = (body.to ?? "").trim();
  if (!to) {
    return NextResponse.json({ error: "받는 주소를 입력해 주세요." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return NextResponse.json({
      ok: false,
      stage: "config",
      error: "RESEND_API_KEY 또는 EMAIL_FROM 환경변수가 비어 있습니다.",
    });
  }

  // Call Resend directly and surface the raw status/body for diagnosis.
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "[CODE WITH GOLFSCRIPT] 메일 발송 테스트",
        html: "<p>이 메일이 보이면 운영 환경의 메일 발송이 정상입니다.</p>",
        text: "이 메일이 보이면 운영 환경의 메일 발송이 정상입니다.",
      }),
    });
    const text = await res.text().catch(() => "");
    return NextResponse.json({
      ok: res.ok,
      stage: "send",
      status: res.status,
      response: text.slice(0, 500),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      stage: "fetch",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
