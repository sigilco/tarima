/**
 * ALL /api/eve/* — same-origin proxy to the in-process eve runtime.
 *
 * The browser cannot reach the loopback socket the eve runtime serves
 * (127.0.0.1:4310, see agent/runtime.ts), and the server.ts route gate
 * only forwards the /api/* space to this dispatcher — so the eve HTTP
 * channel is proxied under `/api/eve/*` (the prefix is stripped before
 * forwarding: `/api/eve/v1/sessions` -> `<eve origin>/eve/v1/sessions`).
 * `useEveAgent({ baseUrl: "/api/eve" })` targets exactly this.
 *
 * The caller's `tarima_session` cookie is forwarded untouched: eve's
 * channel auth (`agent/channels/eve.ts`) resolves it to the principal —
 * this proxy never widens identity.
 *
 * Streaming is preserved: the upstream body is piped through as bytes
 * with its content type, so eve's session streams arrive incrementally.
 * Eve errors pass through with their own status codes; an unmounted
 * runtime answers 503.
 */
import { getEveOrigin } from "./agent-runtime-state";

const EVE_PREFIX = "/api/eve";

export async function handleEveProxy(request: Request): Promise<Response> {
  const origin = getEveOrigin();
  if (!origin) {
    return Response.json({ error: "agent_unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const upstream = `${origin}${url.pathname.slice(EVE_PREFIX.length)}${url.search}`;

  // Only what eve's channel needs: the session cookie for auth, and the
  // body/accept headers to read the request and negotiate the response.
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  try {
    return await fetch(upstream, {
      method: request.method,
      headers,
      body: request.body,
      // duplex is required by undici when a ReadableStream body is sent.
      ...(request.body ? { duplex: "half" as const } : {}),
      signal: AbortSignal.timeout(600_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "agent_unavailable", message }, { status: 502 });
  }
}
