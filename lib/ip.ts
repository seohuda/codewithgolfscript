import { NextRequest } from "next/server";

/**
 * Best-effort client IP extraction.
 *
 * Behind AWS Amplify/CloudFront the real client IP is in
 * X-Forwarded-For (first hop). Falls back to other common headers.
 * Returns "" when it cannot be determined.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // First entry is the original client.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    ""
  );
}
