/**
 * Sanitizes a user/admin-supplied URL for safe use in href/src.
 *
 * Only http(s) and protocol-relative URLs are allowed. Dangerous
 * schemes like javascript:, data:, vbscript: are rejected, returning
 * an empty string so the attribute is simply omitted.
 */
export function sanitizeUrl(input: unknown): string {
  const url = String(input ?? "").trim();
  if (!url) return "";

  // Reject control characters that can smuggle a scheme (e.g. "java\tscript:").
  // eslint-disable-next-line no-control-regex
  const cleaned = url.replace(/[\u0000-\u001f\u007f]/g, "");

  // Allow protocol-relative ("//host/...") and root-relative ("/path").
  if (cleaned.startsWith("//") || cleaned.startsWith("/")) return cleaned;

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
}
