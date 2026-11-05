/**
 * Shared helpers for the web-standard (Fetch API) api handlers.
 *
 * Every handler is a plain `(request: Request) => Response | Promise<Response>`
 * function; these helpers cover the bits the old Hono context used to
 * provide: path params, json body parsing and the CORS header the api
 * surface carried.
 */
import { resolveSessionUserId } from "@tarima/api/services/session";
import { verifyApiKey } from "@tarima/api-keys";
import { createDbApiKeyStore } from "@tarima/api/services/api-key-store";
import { bearerToken } from "@tarima/api/middleware/require-api-key";
import { db } from "@tarima/api/db";

/** The verified session user of a request, or undefined. */
export function sessionUserId(request: Request): string | undefined {
  return resolveSessionUserId(request);
}

/** Who is calling, and with what credential (api-keys route table). */
export type Caller =
  | { kind: "session"; userId: string }
  | { kind: "bearer"; userId: string; scopes: string[] }
  | { kind: "invalid" }
  | { kind: "anonymous" };

/** Resolve the caller: session cookie first, Bearer key second. */
export function resolveCaller(request: Request): Caller {
  const userId = sessionUserId(request);
  if (userId) return { kind: "session", userId };

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
export function authorize(
  caller: Caller,
  requiredScope: string,
): { ok: true; userId: string } | { ok: false; status: 401 | 403 } {
  if (caller.kind === "anonymous" || caller.kind === "invalid") return { ok: false, status: 401 };
  if (caller.kind === "bearer" && !caller.scopes.includes(requiredScope)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, userId: caller.userId };
}

/** Require a valid bearer key carrying at least one of `scopes`. */
export function requireApiKey(
  request: Request,
  scopes: string[],
): { ok: true; userId: string; scopes: string[] } | { ok: false; response: Response } {
  const token = bearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  const verified = verifyApiKey(createDbApiKeyStore(db), token);
  if (!verified) {
    return {
      ok: false,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  const hasAny = scopes.some((scope) => verified.scopes.includes(scope));
  if (scopes.length > 0 && !hasAny) {
    return { ok: false, response: Response.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: verified.userId, scopes: verified.scopes };
}

/** Parse a json body, or null when it is not parseable. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** CORS header for the /api/* machine surface (same policy as before). */
export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Split a pathname into decoded segments. */
export function segments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean).map(decodeURIComponent);
}
