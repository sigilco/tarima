import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Customer-facing session cookie.
 *
 * Spec-mandated attrs:
 *   HttpOnly   — JS can't read it (XSS exfiltration)
 *   Secure     — only over HTTPS; gated by isProduction so dev on
 *                plain http://localhost can still log in
 *   SameSite=Lax — top-level navigation from email links still works;
 *                  cross-site POST is blocked (CSRF defence in depth)
 *   Path=/     — sent on every route including RPC transports
 *   Max-Age=86400 — 24h TTL
 */
export const SESSION_COOKIE = "tarima_session";
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on length mismatch; the explicit check lets us
  // short-circuit false without a throw (and without leaking length).
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Sign a session token good for `ttlSeconds` from now.
 * Format: `<userId>.<expiresAtUnix>.<hmac>` where
 *   hmac = HMAC-SHA256(SECRET, `<userId>.<expiresAtUnix>`).
 * `secret` is caller-resolved — the api app reads SESSION_SECRET (or
 * BREVO_API_KEY as a fallback when SESSION_SECRET is unset) and passes
 * it in; the package never reads ambient env.
 */
export function createSessionToken(
  userId: string,
  secret: string,
  ttlSeconds: number = SESSION_TTL_SECONDS,
  now: number = Date.now(),
): string {
  const expiresAt = Math.floor(now / 1000) + ttlSeconds;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Verify a session token. Returns the userId on success, undefined on any
 *  failure (bad shape, bad HMAC, expired). timingSafeEqual on the HMAC. */
export function verifySessionToken(
  token: string | null | undefined,
  secret: string,
  now: number = Date.now(),
): { userId: string; expiresAt: number } | undefined {
  if (!token) return undefined;
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  const [userId, expiresAtStr, signature] = parts;
  if (!userId || !expiresAtStr || !signature) return undefined;

  const expiresAt = Number.parseInt(expiresAtStr, 10);
  if (!Number.isFinite(expiresAt)) return undefined;
  if (Math.floor(now / 1000) >= expiresAt) return undefined;

  const expected = sign(`${userId}.${expiresAt}`, secret);
  if (!safeEqual(signature, expected)) return undefined;

  return { userId, expiresAt };
}

/** Set-Cookie header value for a freshly-signed session. `isProduction`
 *  must be the caller's resolution of NODE_ENV — the package stays env-free. */
export function sessionCookieHeader(
  token: string,
  isProduction: boolean,
  maxAgeSeconds: number = SESSION_TTL_SECONDS,
): string {
  const secureAttr = isProduction ? "Secure; " : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly; ${secureAttr}SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

/** Set-Cookie header value that clears the session cookie. */
export function clearSessionCookieHeader(isProduction: boolean): string {
  const secureAttr = isProduction ? "Secure; " : "";
  return `${SESSION_COOKIE}=; HttpOnly; ${secureAttr}SameSite=Lax; Path=/; Max-Age=0`;
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("Cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export function readSessionCookie(request: Request): string | undefined {
  return readCookie(request, SESSION_COOKIE);
}
