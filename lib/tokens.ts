import { randomBytes, createHash } from "crypto";

/**
 * One-time token helpers for email verification and password reset.
 *
 * A raw token is sent in the email link; only its SHA-256 hash is stored
 * in the database. Lookups hash the incoming token and compare, so a DB
 * leak never exposes usable tokens.
 */

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = hashToken(raw);
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export const VERIFY_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h
export const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1h
