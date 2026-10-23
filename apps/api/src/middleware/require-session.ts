/**
 * Session-cookie middleware for the web app's browser calls (Stage 5, T5.2).
 *
 * The REST surface in `routes/projects|entities|workflows|csv.ts` is protected
 * by `requireApiKey` (Bearer only, machine surface, curl/MCP/CLI). The board
 * UI is a human in a browser: it carries the `tarima_session` cookie minted by
 * `/auth/verify-otp` and cannot attach a Bearer key. Rather than widen the
 * bearer middleware (a shared surface owned by the parity gate), this module
 * offers the cookie credential on a dedicated read-mostly surface under
 * `/api/ui/*` that mirrors the service functions the bearer routes call.
 *
 * Failure modes:
 *   - no cookie / invalid cookie / expired cookie -> 401 `{error:"unauthorized"}`
 *
 * A valid session carries no scope list (it is the human), so every route
 * behind this middleware is answerable with the user id alone.
 */
import type { Context, MiddlewareHandler } from "hono";
import { resolveSessionUserId } from "../services/session";

/** The verified session user, as stored on the Hono context. */
export interface SessionState {
  userId: string;
}

/** Hono context variable holding the verified session user. */
const SESSION_VAR = "sessionUser";

/** Typed variable map so `c.get("sessionUser")` is `SessionState | undefined`. */
interface SessionEnv {
  Variables: { [SESSION_VAR]: SessionState };
}

/**
 * Middleware factory: require a valid `tarima_session` cookie. On success the
 * user id lands on `c.get("sessionUser")`.
 */
export function requireSession(): MiddlewareHandler<SessionEnv> {
  return async (c, next) => {
    const userId = resolveSessionUserId(c.req.raw);
    if (!userId) return c.json({ error: "unauthorized" }, 401);
    c.set(SESSION_VAR, { userId });
    await next();
  };
}

/** The session user of a request, or undefined when unauthenticated. */
export function getSessionUser(c: Context): SessionState | undefined {
  return c.get(SESSION_VAR) as SessionState | undefined;
}
