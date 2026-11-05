/**
 * API key admin handlers (session-or-bearer credential model).
 * Ported from apps/api/src/routes/api-keys.ts, unchanged logic.
 */
import * as v from "valibot";
import { createApiKeySchema } from "@tarima/contract";
import { db } from "@tarima/api/db";
import {
  createApiKeyForUser,
  listApiKeysForUser,
  revokeApiKey,
} from "@tarima/api/services/api-keys";
import { isApiScope } from "@tarima/api/services/scopes";
import { authorize, readJson, resolveCaller } from "./helpers";

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

const unauthorized = (status: 401 | 403) =>
  Response.json({ error: status === 401 ? "unauthorized" : "forbidden" }, { status });

/** POST /api/api-keys — body { name, scopes }. */
export async function handleCreateApiKey(request: Request): Promise<Response> {
  const allowed = authorize(resolveCaller(request), "api-keys:write");
  if (!allowed.ok) return unauthorized(allowed.status);

  const parsed = v.safeParse(createSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  // Reject unknown scopes instead of silently dropping them: a caller
  // that asked for "project:read" (typo) must not get a key that
  // silently does less than it asked for.
  const scopes = parsed.output.scopes.filter(isApiScope);
  if (scopes.length !== parsed.output.scopes.length) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const created = createApiKeyForUser(db, allowed.userId, parsed.output.name, scopes);
  return Response.json(
    {
      id: created.id,
      name: created.name,
      prefix: created.prefix,
      scopes: created.scopes,
      createdAt: new Date(created.createdAt).toISOString(),
      key: created.secret,
    },
    { status: 201 },
  );
}

/** GET /api/api-keys — list the caller's keys. */
export function handleListApiKeys(request: Request): Response {
  const allowed = authorize(resolveCaller(request), "api-keys:read");
  if (!allowed.ok) return unauthorized(allowed.status);

  const keys = listApiKeysForUser(db, allowed.userId).map((key) => ({
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    scopes: key.scopes,
    createdAt: new Date(key.createdAt).toISOString(),
    revokedAt: key.revokedAt === null ? null : new Date(key.revokedAt).toISOString(),
  }));
  return Response.json({ keys });
}

/** DELETE /api/api-keys/:id — revoke one key. */
export function handleRevokeApiKey(request: Request, id: string): Response {
  const allowed = authorize(resolveCaller(request), "api-keys:write");
  if (!allowed.ok) return unauthorized(allowed.status);

  const revoked = revokeApiKey(db, allowed.userId, id);
  if (!revoked) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: true });
}
