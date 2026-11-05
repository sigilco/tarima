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
import type {
  BoardPayload,
  DraftWire,
  InboxPayload,
  ProjectsPayload,
  RoomPayload,
  Served,
  SettingsPayload,
} from "./api";

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

/**
 * The staged drafts of one project (the send gate list).
 *
 * The api answers with the draft list; both shapes are accepted (a bare
 * array and a `{ drafts }` envelope), and a project without drafts reads
 * as an empty list. A 404 is not fatal: the drafts endpoint is optional,
 * so a board without it still renders.
 */
export const fetchDraftsFn = createServerFn({ method: "GET", strict: false })
  .validator((raw: unknown) => v.parse(projectIdSchema, raw))
  .handler(async ({ data }): Promise<Served<DraftWire[]>> => {
    const res = await apiGet(`/api/ui/projects/${encodeURIComponent(data)}/drafts`);
    if (res.status === 404) return { status: 404, body: [] };
    const body = (await res.json().catch(() => null)) as unknown;
    return { status: res.status, body: normalizeDrafts(body) };
  });

/** The drafts of a payload, whichever shape the api used. */
function normalizeDrafts(body: unknown): DraftWire[] {
  const list = Array.isArray(body)
    ? body
    : Array.isArray((body as { drafts?: unknown } | null)?.drafts)
      ? (body as { drafts: unknown[] }).drafts
      : [];
  return list.filter((draft): draft is DraftWire => {
    const record = draft as Partial<DraftWire> | null;
    return typeof record === "object" && record !== null && typeof record.entityId === "string";
  });
}

/**
 * Whether the incoming request carries a valid session.
 *
 * The landing page uses it to offer "Open the app" to a signed-in
 * visitor instead of a sign-in link. The check reuses the api's own
 * answer (a 200 on the project list means the session cookie is good),
 * so the browser never has to read the HttpOnly cookie.
 */
export const fetchSessionFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ signedIn: boolean }> => {
    const res = await apiGet("/api/ui/projects");
    return { signedIn: res.status === 200 };
  },
);

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

/** The negotiation room payload (for owner or observer). */
export const fetchRoomFn = createServerFn({ method: "GET", strict: false })
  .validator((raw: unknown) => raw as { projectId: string; shareToken?: string })
  .handler(async ({ data }): Promise<Served<RoomPayload>> => {
    const query = data.shareToken ? `?share_token=${encodeURIComponent(data.shareToken)}` : "";
    const res = await apiGet(`/api/ui/projects/${encodeURIComponent(data.projectId)}/room${query}`);
    return {
      status: res.status,
      body: (await res.json().catch(() => null)) as RoomPayload | null,
    };
  });
