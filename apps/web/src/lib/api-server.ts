/**
 * Server-side data functions (Stage 5, T5.2).
 *
 * Each function is a TanStack Start server function: the handler body is
 * compiled into the server bundle only, so it may read the incoming
 * request (the session cookie of the browser navigation) and forward it
 * to the api. The browser calls the same functions through the RPC
 * bridge, so a client-side navigation authenticates exactly like SSR.
 *
 * The answers are returned as `{status, body}` rather than thrown, so
 * the caller decides what a 401 means (the routes redirect to /login).
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import * as v from "valibot";
import type { BoardPayload, InboxPayload, ProjectsPayload, Served, SettingsPayload } from "./api";

/** The incoming request's cookie header, or undefined outside a request. */
function requestCookies(): string | undefined {
  try {
    return getRequest().headers.get("cookie") ?? undefined;
  } catch {
    return undefined;
  }
}

/** The project id of the board route. */
const projectIdSchema = v.pipe(v.string(), v.minLength(1));

// Every GET server fn in this module runs with `strict: false`: the
// payloads carry the contract's free-form `goal` record, which the SSR
// serializer's static serializable union cannot type. The runtime
// payload is plain json either way.

/**
 * The origin of the api when the server function runs on the server.
 *
 * In production the web app and the api are the same process, so a
 * relative url is right, but node's fetch has no notion of the current
 * origin: it needs an absolute one. The request that triggered this
 * server function carries it, so we read it from there. In dev the vite
 * proxy answers on the same origin the browser used, which also works.
 */
function apiOrigin(): string {
  try {
    const url = getRequest().url;
    return new URL(url).origin;
  } catch {
    return process.env.VITE_API_ORIGIN ?? "";
  }
}

/** GET against the api, forwarding the session cookie. */
async function apiGet(path: string): Promise<Response> {
  const headers = new Headers();
  const cookie = requestCookies();
  if (cookie) headers.set("cookie", cookie);
  const origin = apiOrigin();
  return fetch(origin ? `${origin}${path}` : path, { headers });
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

/** The board payload of one project. */
export const fetchBoardFn = createServerFn({ method: "GET", strict: false })
  .validator((raw: unknown) => v.parse(projectIdSchema, raw))
  .handler(async ({ data }): Promise<Served<BoardPayload>> => {
    const res = await apiGet(`/api/ui/projects/${encodeURIComponent(data)}/board`);
    return {
      status: res.status,
      body: (await res.json().catch(() => null)) as BoardPayload | null,
    };
  });

/** The settings payload of the signed in user. */
export const fetchSettingsFn = createServerFn({ method: "GET", strict: false }).handler(
  async (): Promise<Served<SettingsPayload>> => {
    const res = await apiGet("/api/ui/settings");
    return {
      status: res.status,
      body: (await res.json().catch(() => null)) as SettingsPayload | null,
    };
  },
);

/** The in-app inbox of the signed in user. */
export const fetchInboxFn = createServerFn({ method: "GET", strict: false }).handler(
  async (): Promise<Served<InboxPayload>> => {
    const res = await apiGet("/api/ui/settings/messages");
    return {
      status: res.status,
      body: (await res.json().catch(() => null)) as InboxPayload | null,
    };
  },
);
