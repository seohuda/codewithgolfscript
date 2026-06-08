import { NextRequest } from "next/server";

/**
 * Best-effort client IP extraction.
 *
 * The app runs behind AWS Amplify/CloudFront, a trusted reverse proxy
 * that APPENDS the real connecting IP to the END of X-Forwarded-For.
 * A malicious client can prepend arbitrary values, so the LAST entry
 * (added by the trusted proxy) is the trustworthy one — never the first.
 *
 * Returns "" when it cannot be determined.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      // Last hop = appended by the trusted proxy. Resistant to client
      // spoofing of earlier entries.
      return parts[parts.length - 1];
    }
  }
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    ""
  );
}
