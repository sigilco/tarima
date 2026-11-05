/**
 * Shared helpers for the web-standard (Fetch API) api handlers.
 *
 * Every handler is a plain `(request: Request) => Response | Promise<Response>`
 * function; these helpers cover the bits the old Hono context used to
 * provide: path params, json body parsing and the CORS header the api
 * surface carried.
 *
 * SP7 teardown: the bearer-key surface went away with the legacy UI, so
 * the api-key verification helpers are gone too.
 */
import { resolveSessionUserId } from "@tarima/api/services/session";

/** The verified session user of a request, or undefined. */
export function sessionUserId(request: Request): string | undefined {
  return resolveSessionUserId(request);
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

// The bundler statically replaces `process.env.NODE_ENV` with the
// build-time value ("production" for the nitro build), which would fold
// a literal guard away. Read it through a computed key so the check
// stays a runtime decision, like the standalone api's tsx run.
const NODE_ENV_KEY = "NODE_ENV";

/** Runtime NODE_ENV === "production" check (not bundler-folded). */
export function isProduction(): boolean {
  return process.env[NODE_ENV_KEY] === "production";
}
