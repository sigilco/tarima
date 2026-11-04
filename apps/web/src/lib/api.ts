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
import type { ApprovalGate, Brief, ProjectStage } from "@tarima/contract";

/** The wire shape of a project (contract `projectSchema`). */
export interface ProjectWire {
  id: string;
  name: string;
  goal: Record<string, unknown>;
  /** Approval-flow stage (contract `projectStageSchema`), absent on old rows. */
  stage?: ProjectStage;
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
  /** The gate waiting on the user, when the api sends it (contract stage.ts). */
  pendingGate?: ApprovalGate;
}

/** The project list payload. */
export interface ProjectsPayload {
  projects: ProjectWire[];
}

/** One staged outreach draft, as the send gate lists it. */
export interface DraftWire {
  entityId: string;
  entityName: string;
  to: string;
  subject: string;
  body: string;
}

/** The drafts payload: the staged drafts of a project. */
export interface DraftsPayload {
  drafts: DraftWire[];
}

/** The answer of a stage move (contract `stageResponseSchema`). */
export interface StageResult {
  projectId: string;
  stage: ProjectStage;
  pendingGate?: ApprovalGate;
}

/** The answer of a gate decision (contract `approveResponseSchema`). */
export interface ApproveResult {
  projectId: string;
  stage: ProjectStage;
  pendingGate?: ApprovalGate;
  released: number;
  discarded: number;
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

/** Set the contact of a board row (the "no contact" affordance). */
export function setRowContact(
  projectId: string,
  entityId: string,
  contact: string,
): Promise<{ entity: BoardRow }> {
  return call<{ entity: BoardRow }>(
    `/api/ui/projects/${encodeURIComponent(projectId)}/entities/${encodeURIComponent(entityId)}/contact`,
    { method: "PATCH", body: JSON.stringify({ contact }) },
  );
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
export function eventsUrl(projectId: string, shareToken?: string): string {
  const base = `${apiOrigin()}/api/ui/projects/${encodeURIComponent(projectId)}/events`;
  return shareToken ? `${base}?share_token=${encodeURIComponent(shareToken)}` : base;
}

export interface RoomPayload {
  project: {
    id: string;
    name: string;
    description: string | null;
    stage: string;
    goal: Record<string, unknown>;
  };
  room: {
    id: string;
    name: string;
    status: string;
    terms?: Record<string, unknown>;
  };
  access: {
    role: "owner" | "observer";
    readOnly: boolean;
    expiresAt: number | null;
    sharedByName?: string | null;
  };
}

export interface MintRoomLinkResult {
  link: {
    id: string;
    projectId: string;
    token: string;
    shareUrl: string;
    createdAt: number;
    expiresAt: number | null;
    viewCount: number;
  };
  shareUrl: string;
}

/** Mint or retrieve the live room observer link for a project. */
export function mintRoomLink(projectId: string, ttlDays?: number): Promise<MintRoomLinkResult> {
  return call<MintRoomLinkResult>(`/api/ui/projects/${encodeURIComponent(projectId)}/room-link`, {
    method: "POST",
    body: JSON.stringify(ttlDays ? { ttlDays } : {}),
  });
}

/** Revoke the active room observer link for a project. */
export function revokeRoomLink(projectId: string): Promise<{ ok: boolean; revokedAt: number }> {
  return call<{ ok: boolean; revokedAt: number }>(
    `/api/ui/projects/${encodeURIComponent(projectId)}/room-link`,
    {
      method: "DELETE",
    },
  );
}

/** Fetch negotiation room state (for owner or observer). */
export function fetchRoom(projectId: string, shareToken?: string): Promise<RoomPayload> {
  const query = shareToken ? `?share_token=${encodeURIComponent(shareToken)}` : "";
  return call<RoomPayload>(`/api/ui/projects/${encodeURIComponent(projectId)}/room${query}`);
}

/** The WebSocket url for the negotiation room. */
export function roomWsUrl(projectId: string, shareToken?: string): string {
  if (typeof window === "undefined") return "";
  const loc = window.location;
  const proto = loc.protocol === "https:" ? "wss:" : "ws:";
  const origin = `${proto}//${loc.host}`;
  const base = `${origin}/api/ui/projects/${encodeURIComponent(projectId)}/room/ws`;
  return shareToken ? `${base}?share_token=${encodeURIComponent(shareToken)}` : base;
}

/** Dispatch the staged counter proposal to vendor (owner-only HITL send). */
export function sendNegotiationCounter(
  projectId: string,
  negotiationId: string,
): Promise<{ ok: boolean; negotiation: unknown }> {
  return call<{ ok: boolean; negotiation: unknown }>(
    `/api/ui/projects/${encodeURIComponent(projectId)}/negotiations/${encodeURIComponent(negotiationId)}/send`,
    {
      method: "POST",
    },
  );
}

/** The channels a user can bind (contract `BINDING_CHANNELS`). */
export type BindingChannel = "telegram" | "whatsapp";

/** One bound channel (contract `channelBindingSchema`, plus the endpoint). */
export interface BindingWire {
  id: string;
  channel: BindingChannel;
  label: string | null;
  externalId: string;
  createdAt: string;
}

/** A freshly minted connect code (shown once, valid for 15 minutes). */
export interface ConnectCodeWire {
  code: string;
  expiresAt: string;
}

/** One in-app inbox message. */
export interface MessageWire {
  id: string;
  projectId: string | null;
  kind: "status_change" | "approval_needed" | "digest";
  summary: string;
  read: boolean;
  createdAt: string;
}

/** The settings payload: the bound channels and the unread counter. */
export interface SettingsPayload {
  bindings: BindingWire[];
  unread: number;
}

/** The inbox payload: the messages and the unread counter. */
export interface InboxPayload {
  messages: MessageWire[];
  unread: number;
}

/** Mint a connect code for one channel. */
export function createConnectCode(channel: BindingChannel): Promise<ConnectCodeWire> {
  return call<ConnectCodeWire>("/api/ui/settings/connect-code", {
    method: "POST",
    body: JSON.stringify({ channel }),
  });
}

/** Drop one binding. */
export function removeBinding(bindingId: string): Promise<{ ok: boolean }> {
  return call<{ ok: boolean }>(`/api/ui/settings/bindings/${encodeURIComponent(bindingId)}`, {
    method: "DELETE",
  });
}

/** Mark the given messages read (or every message when ids is omitted). */
export function markMessagesRead(ids?: string[]): Promise<{ unread: number }> {
  return call<{ unread: number }>("/api/ui/settings/messages/read", {
    method: "POST",
    body: JSON.stringify(ids ? { ids } : {}),
  });
}

/** The project id path segment, encoded. */
function projectPath(projectId: string): string {
  return `/api/ui/projects/${encodeURIComponent(projectId)}`;
}

/** Move the project forward (contract `stageRequestSchema`). */
export function advanceStage(
  projectId: string,
  to: "spec_review" | "curating",
): Promise<StageResult> {
  return call<StageResult>(`${projectPath(projectId)}/stage`, {
    method: "POST",
    body: JSON.stringify({ to }),
  });
}

/** Decide the pending gate (contract `approveRequestSchema`). */
export function decideGate(
  projectId: string,
  input: {
    gate: ApprovalGate;
    decision: "approve" | "reject";
    brief?: Brief;
    entityIds?: string[];
  },
): Promise<ApproveResult> {
  return call<ApproveResult>(`${projectPath(projectId)}/approve`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Run curation against the venue catalog (contract `curateResponseSchema`). */
export function curate(projectId: string): Promise<{
  projectId: string;
  candidates: number;
  stage: ProjectStage;
}> {
  return call<{ projectId: string; candidates: number; stage: ProjectStage }>(
    `${projectPath(projectId)}/curate`,
    { method: "POST" },
  );
}

/** The staged drafts of a project (the send gate list). */
export function fetchDrafts(projectId: string): Promise<DraftsPayload> {
  return call<DraftsPayload>(`${projectPath(projectId)}/drafts`);
}
