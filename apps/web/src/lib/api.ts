/**
 * The workspace shell's api client (SP7 teardown).
 *
 * Only what the new shell uses: create a project from the project list
 * view. Everything else (board, brief, chase, room, csv, settings,
 * inbox) went away with the legacy UI.
 */
import type { ProjectStage } from "@tarima/contract";

export interface ProjectWire {
  id: string;
  name: string;
  description: string | null;
  /** Approval-flow stage (contract `projectStageSchema`), absent on old rows. */
  stage?: ProjectStage;
  goal: Record<string, unknown>;
  createdAt: string;
}

export interface ProjectsPayload {
  projects: ProjectWire[];
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("not_found");
    this.name = "NotFoundError";
  }
}

/**
 * The base url of the api. In production the web app is served by the
 * same process as the api, so the api lives on the same origin; in dev
 * the vite proxy forwards /api to the api process.
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

/** The observer link wire shape (contract `observerLinkSchema`). */
export interface ObserverLinkWire {
  id: string;
  projectId: string;
  roomId: string | null;
  token: string;
  shareUrl: string;
  createdBy: string | null;
  createdAt: number;
  expiresAt: number | null;
  revokedAt: number | null;
  viewCount: number;
  lastViewedAt: number | null;
}

/** Mint (or fetch the live) observer link for a project. */
export function createObserverLink(projectId: string): Promise<{ link: ObserverLinkWire }> {
  return call<{ link: ObserverLinkWire }>(
    `/api/ui/projects/${encodeURIComponent(projectId)}/observer-link`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

/** Revoke every live observer link for a project. */
export function revokeObserverLink(projectId: string): Promise<{ ok: boolean; revokedAt: number }> {
  return call<{ ok: boolean; revokedAt: number }>(
    `/api/ui/projects/${encodeURIComponent(projectId)}/observer-link`,
    { method: "DELETE" },
  );
}
