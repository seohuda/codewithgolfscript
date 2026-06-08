import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";

/**
 * Authentication helpers (server-only).
 *
 *  - Passwords are hashed with scrypt and a per-user random salt.
 *  - Sessions are stateless signed tokens (HMAC-SHA256) stored in an
 *    httpOnly cookie. No session table required.
 */

const SCRYPT_KEYLEN = 64;

/** Hashes a password. Returns "scrypt$<saltHex>$<hashHex>". */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** Verifies a password against a stored "scrypt$salt$hash" string. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const derived = scryptSync(password, salt, expected.length);
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// Session tokens
// ----------------------------------------------------------------------
export const SESSION_COOKIE = "gs_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;

  // In production a dedicated, sufficiently long secret is mandatory.
  // Falling back to a shared/guessable value would let anyone forge
  // session tokens.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is not set (or too short). Refusing to sign sessions with an insecure fallback in production.",
    );
  }
  return "dev-insecure-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export interface SessionData {
  userId: string;
  username: string;
}

/** Creates a signed session token: base64(payload).signature */
export function createSessionToken(data: SessionData): string {
  const body = {
    userId: data.userId,
    username: data.username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const json = JSON.stringify(body);
  const b64 = Buffer.from(json, "utf8").toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

/** Verifies and decodes a session token. Returns null if invalid/expired. */
export function verifySessionToken(token: string | undefined): SessionData | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expectedSig = sign(b64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const json = Buffer.from(b64, "base64url").toString("utf8");
    const body = JSON.parse(json) as {
      userId: string;
      username: string;
      exp: number;
    };
    if (typeof body.exp !== "number" || body.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { userId: body.userId, username: body.username };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
  secure: process.env.NODE_ENV === "production",
};

// ----------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------
export function validateUsername(username: string): string | null {
  if (!username) return "아이디를 입력해 주세요.";
  if (username.length < 3) return "아이디는 3자 이상이어야 합니다.";
  if (username.length > 20) return "아이디는 20자 이하여야 합니다.";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "비밀번호를 입력해 주세요.";
  if (password.length < 6) return "비밀번호는 6자 이상이어야 합니다.";
  if (password.length > 200) return "비밀번호가 너무 깁니다.";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return "이메일을 입력해 주세요.";
  if (email.length > 254) return "이메일이 너무 깁니다.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "올바른 이메일 형식이 아닙니다.";
  }
  return null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Escapes PostgREST/SQL LIKE wildcards (% and _) so a value can be used
 * in an `.ilike()` filter as a literal, case-insensitive exact match.
 * Without this, "_" (single-char wildcard) lets "a_min" match "admin".
 */
export function escapeLike(value: string): string {
  return value.replace(/([\\%_])/g, "\\$1");
}
