/**
 * API key admin routes.
 *
 * AUTH MODEL (dual credential, session wins):
 *   The caller may authenticate with EITHER
 *     (a) a session cookie (the browser flow), or
 *     (b) a Bearer API key that carries the required scope (the machine
 *         flow: a key can mint its siblings).
 *   When both are present the session cookie wins, because a browser
 *   session is the stronger, human-attributable credential. When
 *   neither is present the request is 401.
 *
 *   The caller's user id comes from the session cookie when present,
 *   otherwise from the verified Bearer key. The minted key always
 *   belongs to that user id.
 *
 *   Scope enforcement applies to the Bearer credential only: a session
 *   cookie is a human session and carries no scope list. A Bearer key
 *   without the required scope is 403, a Bearer key that does not
 *   verify is 401.
 *
 * The plaintext key is returned exactly once, in the creation response.
 * Only its hash is stored, so the list endpoint can never leak a secret.
 */
import { Hono } from "hono";
import * as v from "valibot";
import { verifyApiKey } from "@tarima/api-keys";
import { createApiKeySchema } from "@tarima/contract";
import { db } from "../db";
import { createDbApiKeyStore } from "../services/api-key-store";
import { createApiKeyForUser, listApiKeysForUser, revokeApiKey } from "../services/api-keys";
import { resolveSessionUserId } from "../services/session";
import { isApiScope } from "../services/scopes";
import { bearerToken } from "../middleware/require-api-key";

/**
 * The contract publishes the scope picklist for api keys
 * (projects:read/write, entities:read/write). The api also needs
 * scopes for its own surface (api-keys:*, workflows:*), so the scopes
 * array is validated against the api-side catalog, a documented
 * superset of the contract list. The contract's own `name` rule is
 * reused verbatim so the wire shape does not drift.
 */
const createSchema = v.object({
  name: createApiKeySchema.entries.name,
  scopes: v.array(v.pipe(v.string(), v.maxLength(64))),
});

/** Who is calling, and with what credential. */
type Caller =
  | { kind: "session"; userId: string }
  | { kind: "bearer"; userId: string; scopes: string[] }
  | { kind: "invalid"; userId?: undefined }
  | { kind: "anonymous"; userId?: undefined };

/**
 * Resolve the caller: session cookie first, Bearer key second. The
 * Bearer key must verify; an invalid one is "invalid" (401), not
 * "anonymous".
 */
function resolveCaller(request: Request): Caller {
  const sessionUserId = resolveSessionUserId(request);
  if (sessionUserId) return { kind: "session", userId: sessionUserId };

  const token = bearerToken(request);
  if (!token) return { kind: "anonymous" };

  const verified = verifyApiKey(createDbApiKeyStore(db), token);
  if (!verified) return { kind: "invalid" };
  return { kind: "bearer", userId: verified.userId, scopes: verified.scopes };
}

/**
 * Check the caller's authority for a scope-bearing operation. Returns
 * the caller's user id when the caller may proceed, or the status to
 * answer with (401/403) when it may not.
 */
function authorize(
  caller: Caller,
  requiredScope: string,
): { ok: true; userId: string } | { ok: false; status: 401 | 403 } {
  if (caller.kind === "anonymous" || caller.kind === "invalid") return { ok: false, status: 401 };
  if (caller.kind === "bearer" && !caller.scopes.includes(requiredScope)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, userId: caller.userId };
}

export const apiKeyRoutes = new Hono()
  .post("/api/api-keys", async (c) => {
    const caller = resolveCaller(c.req.raw);
    const allowed = authorize(caller, "api-keys:write");
    if (!allowed.ok) {
      return c.json(
        { error: allowed.status === 401 ? "unauthorized" : "forbidden" },
        allowed.status,
      );
    }

    const parsed = v.safeParse(createSchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    // Reject unknown scopes instead of silently dropping them: a caller
    // that asked for "project:read" (typo) must not get a key that
    // silently does less than it asked for.
    const scopes = parsed.output.scopes.filter(isApiScope);
    if (scopes.length !== parsed.output.scopes.length) {
      return c.json({ error: "invalid_request" }, 400);
    }

    const created = createApiKeyForUser(db, allowed.userId, parsed.output.name, scopes);
    return c.json(
      {
        id: created.id,
        name: created.name,
        prefix: created.prefix,
        scopes: created.scopes,
        createdAt: new Date(created.createdAt).toISOString(),
        key: created.secret,
      },
      201,
    );
  })
  .get("/api/api-keys", (c) => {
    const caller = resolveCaller(c.req.raw);
    const allowed = authorize(caller, "api-keys:read");
    if (!allowed.ok) {
      return c.json(
        { error: allowed.status === 401 ? "unauthorized" : "forbidden" },
        allowed.status,
      );
    }

    const keys = listApiKeysForUser(db, allowed.userId).map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      scopes: key.scopes,
      createdAt: new Date(key.createdAt).toISOString(),
      revokedAt: key.revokedAt === null ? null : new Date(key.revokedAt).toISOString(),
    }));
    return c.json({ keys });
  })
  .delete("/api/api-keys/:id", (c) => {
    const caller = resolveCaller(c.req.raw);
    const allowed = authorize(caller, "api-keys:write");
    if (!allowed.ok) {
      return c.json(
        { error: allowed.status === 401 ? "unauthorized" : "forbidden" },
        allowed.status,
      );
    }

    const revoked = revokeApiKey(db, allowed.userId, c.req.param("id"));
    if (!revoked) return c.json({ error: "not_found" }, 404);
    return c.json({ ok: true });
  });
