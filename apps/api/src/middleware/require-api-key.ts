/**
 * Bearer API key middleware.
 *
 * Machine consumers (curl, the MCP endpoint, the CLI) authenticate with
 * `Authorization: Bearer <plaintext key>`. The plaintext is verified
 * against the `api_keys` table through the `@tarima/api-keys` store seam;
 * only the hash is persisted, so a leaked database cannot be replayed.
 *
 * Failure modes are deliberately coarse:
 *   - no header / malformed header / unknown key / revoked key -> 401
 *     `{error:"unauthorized"}` (the caller cannot tell them apart)
 *   - valid key that lacks a required scope -> 403 `{error:"forbidden"}`
 *
 * Scope checks are OR semantics: the key must carry at least one of the
 * required scopes. An empty requirement list means "any valid key".
 *
 * The middleware is NOT applied to `/api/health`, `/auth/*`,
 * `/internal/admin/*` or `/capabilities`: those are mounted on the app
 * without it.
 */
import type { Context, MiddlewareHandler } from "hono";
import { verifyApiKey, type VerifiedKey } from "@tarima/api-keys";
import { db } from "../db";
import { createDbApiKeyStore } from "../services/api-key-store";
import { hasScope } from "../services/scopes";

/** The verified caller, as stored on the Hono context. */
export interface ApiKeyState {
  userId: string;
  scopes: string[];
}

/** Hono context variable holding the verified key. */
const API_KEY_VAR = "apiKey";

/**
 * The bearer token of a request, or undefined when the header is absent
 * or is not a well-formed `Bearer <token>` pair.
 */
export function bearerToken(request: Request): string | undefined {
  const header = request.headers.get("Authorization") ?? request.headers.get("authorization");
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token ? token : undefined;
}

/** The verified API key of the request, or undefined when there is none. */
export function getApiKey(c: Context): ApiKeyState | undefined {
  return c.get(API_KEY_VAR) as ApiKeyState | undefined;
}

/**
 * Middleware factory: require a valid bearer key carrying at least one
 * of `scopes`. On success the verified key lands on `c.get("apiKey")`.
 */
export function requireApiKey(scopes: string[]): MiddlewareHandler {
  return async (c, next) => {
    const token = bearerToken(c.req.raw);
    if (!token) return c.json({ error: "unauthorized" }, 401);

    const verified: VerifiedKey | null = verifyApiKey(createDbApiKeyStore(db), token);
    if (!verified) return c.json({ error: "unauthorized" }, 401);

    if (!hasScope(verified.scopes, scopes)) return c.json({ error: "forbidden" }, 403);

    c.set(API_KEY_VAR, { userId: verified.userId, scopes: verified.scopes });
    await next();
  };
}
