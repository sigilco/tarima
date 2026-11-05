/**
 * Server boot seam: a 503 Response for requests that arrive before the
 * api handler table is built. The table is built synchronously at module
 * scope in `server.ts`, so this is a defensive guard, not a real race.
 */
export function runtimeNotReadyResponse(): Response {
  return Response.json({ error: "runtime_not_ready" }, { status: 503 });
}
