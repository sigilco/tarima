/**
 * Server-side data functions (SP7 teardown).
 *
 * Each function is a TanStack Start server function: the handler body is
 * compiled into the server bundle only, so it may read the incoming
 * request (the session cookie of the browser navigation) and forward it
 * to the api. The browser calls the same functions through the RPC
 * bridge, so a client-side navigation authenticates exactly like SSR.
 *
 * After the teardown only the project list survives: the workspace
 * shell's /app route needs it to render the sidebar and the grid.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { ProjectsPayload, Served } from "./api";

/** The incoming request's cookie header, or undefined outside a request. */
function requestCookies(): string | undefined {
  try {
    return getRequest().headers.get("cookie") ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * The origin of the api when the server function runs on the server.
 *
 * The api handlers are mounted in-process (see src/server.ts), so the
 * api lives on the very origin the request came in on: we read it from
 * the triggering request. Outside a request (build, prerender) we fall
 * back to the same-process loopback on the server's own port.
 */
function apiOrigin(): string {
  try {
    const url = getRequest().url;
    return new URL(url).origin;
  } catch {
    return process.env.VITE_API_ORIGIN ?? `http://localhost:${process.env.PORT ?? 3000}`;
  }
}

/** GET against the api, forwarding the session cookie. */
async function apiGet(path: string): Promise<Response> {
  const headers = new Headers();
  const cookie = requestCookies();
  if (cookie) headers.set("cookie", cookie);
  const origin = apiOrigin();
  try {
    return await fetch(origin ? `${origin}${path}` : path, { headers });
  } catch {
    return new Response(null, { status: 503 });
  }
}

/** The project list payload (see lib/api.ts for the shapes). */
export const fetchProjectsFn = createServerFn({ method: "GET", strict: false }).handler(
  async (): Promise<Served<ProjectsPayload>> => {
    const res = await apiGet("/api/ui/projects");
    return {
      status: res.status,
      body: (await res.json().catch(() => null)) as ProjectsPayload | null,
    };
  },
);
