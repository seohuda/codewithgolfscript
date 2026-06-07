import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "problem-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

// POST /api/admin/upload  (multipart/form-data, field "file")
export async function POST(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "PNG, JPG, GIF, WEBP 이미지만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "이미지 크기는 5MB 이하여야 합니다." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  const admin = getSupabaseAdminClient();
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(name, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json(
      { error: `업로드 실패: ${error.message}` },
      { status: 500 },
    );
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(name);
  return NextResponse.json({ url: data.publicUrl });
}
