/**
 * The board app's api client (Stage 5, T5.2).
 *
 * Two transports, one set of shapes:
 *   - route loaders call the server functions of `lib/api-server.ts`,
 *     which run on the server and forward the session cookie of the
 *     incoming request to the api;
 *   - the browser calls the same-origin endpoints directly for the
 *     actions (create, import, chase), where the cookie rides along.
 *
 * A 401 means "no session": the loader redirects to /login. The api
 * answers 404 for an unknown project, which is NOT a session problem.
 */
import type { BoardRow } from "./board";
import type { Brief } from "@tarima/contract";

/** The wire shape of a project (contract `projectSchema`). */
export interface ProjectWire {
  id: string;
  name: string;
  goal: Record<string, unknown>;
  createdAt: string;
}

/** The brief of a project, as it sits under `goal.brief`. */
export function projectBrief(project: ProjectWire): Brief | undefined {
  const brief = project.goal?.brief;
  return brief as Brief | undefined;
}

/** One bucket's count, as the header chips render it. */
export interface BucketCount {
  bucket: string;
  count: number;
}

/** The board payload: project, rows, bucket counts. */
export interface BoardPayload {
  project: ProjectWire;
  entities: BoardRow[];
  summary: { buckets: BucketCount[]; total: number };
}

/** The project list payload. */
export interface ProjectsPayload {
  projects: ProjectWire[];
}

/** One rejected csv row, as the import modal reports it. */
export interface IntakeRowError {
  row: number;
  message: string;
}

/** The outcome of a bulk intake. */
export interface BulkIntakeResult {
  created: number;
  entities: BoardRow[];
  errors: IntakeRowError[];
}

/** Raised when the api answers 401: the browser has no valid session. */
export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** Raised when the api answers 404. */
export class NotFoundError extends Error {
  constructor(message = "not_found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * The base url of the api. In production the web app is served by the
 * same process as the api (the Hono runtime), so the api lives on the
 * same origin; in dev the vite proxy forwards /api to :3001.
 */
function apiOrigin(): string {
  const configured = import.meta.env.VITE_API_ORIGIN as string | undefined;
  return configured ? configured.replace(/\/$/, "") : "";
}

/** Call the api from the browser and parse the json answer. */
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("content-type", "application/json");

  const res = await fetch(`${apiOrigin()}${path}`, { ...init, headers });
  if (res.status === 401) throw new UnauthorizedError();
  if (res.status === 404) throw new NotFoundError();
  if (!res.ok) throw new Error(`api request failed: ${res.status}`);
  return (await res.json()) as T;
}

/** The answer shape the server functions return (status + payload). */
export interface Served<T> {
  status: number;
  body: T | null;
}

/** Unwrap a server function answer into data or a thrown error. */
export function unwrap<T>(served: Served<T>): T {
  if (served.status === 401) throw new UnauthorizedError();
  if (served.status === 404) throw new NotFoundError();
  if (served.status !== 200 || served.body === null) {
    throw new Error(`api request failed: ${served.status}`);
  }
  return served.body;
}

/** Create a project. */
export function createProject(
  name: string,
  goal?: Record<string, unknown>,
): Promise<{ project: ProjectWire }> {
  return call<{ project: ProjectWire }>("/api/ui/projects", {
    method: "POST",
    body: JSON.stringify(goal ? { name, goal } : { name }),
  });
}

/** The body of a manual row (the api fills in projectId, status, missing). */
export interface AddRowInput {
  name: string;
  contact?: string;
  channel?: "email" | "telegram" | "manual";
  missing?: string[];
}

/** Add one row to a project by hand. */
export function addRow(projectId: string, input: AddRowInput): Promise<{ entity: BoardRow }> {
  return call<{ entity: BoardRow }>(`/api/ui/projects/${encodeURIComponent(projectId)}/entities`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Import a csv of entities into a project. */
export function bulkIntake(projectId: string, csv: string): Promise<BulkIntakeResult> {
  return call<BulkIntakeResult>(`/api/ui/projects/${encodeURIComponent(projectId)}/entities/bulk`, {
    method: "POST",
    body: JSON.stringify({ csv }),
  });
}

/** Start the chase workflow for the rows that are still waiting. */
export function startChase(
  projectId: string,
): Promise<{ runs: { runId: string; entityId: string }[] }> {
  return call<{ runs: { runId: string; entityId: string }[] }>(
    `/api/ui/projects/${encodeURIComponent(projectId)}/workflows`,
    { method: "POST", body: JSON.stringify({ template: "chase-deliverables" }) },
  );
}

/** The url of the board's event stream. */
export function eventsUrl(projectId: string): string {
  return `${apiOrigin()}/api/ui/projects/${encodeURIComponent(projectId)}/events`;
}
