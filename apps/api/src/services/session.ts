/**
 * Session resolution for the api app.
 *
 * The session cookie is a stateless HMAC token (`<userId>.<expires>.<sig>`)
 * minted by `@tarima/auth-core/session`. This module is the single place
 * where the signing secret is resolved from the environment, so the auth
 * routes and the bearer routes never drift apart on the secret.
 */
import { readSessionCookie, verifySessionToken } from "@tarima/auth-core/session";

/** Signing secret for session cookies. */
export function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-insecure-session-secret";
}

/**
 * The user id behind a request's session cookie, or undefined when the
 * request carries no (valid) session.
 */
export function resolveSessionUserId(request: Request): string | undefined {
  const token = readSessionCookie(request);
  if (!token) return undefined;
  const verified = verifySessionToken(token, sessionSecret());
  return verified?.userId;
}
