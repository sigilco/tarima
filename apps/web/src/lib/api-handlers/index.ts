/**
 * The in-process api dispatcher: one fetch-style function that routes
 * every api/auth/webhook/internal path to the plain (Request => Response)
 * handlers in this directory.
 *
 * The table mirrors apps/api/src/server.ts's Hono mounting (same paths,
 * same methods, same status codes); the handlers themselves are ported
 * from apps/api/src/routes/* unchanged in logic.
 */
import { handleAccessRequest } from "./access-requests";
import { handleCreateApiKey, handleListApiKeys, handleRevokeApiKey } from "./api-keys";
import { handleAdminInbox, handleRequestOtp, handleVerifyOtp } from "./auth";
import { handleCapabilities } from "./capabilities";
import { handleDevLogin } from "./dev-login";
import { segments } from "./helpers";
import {
  handleBulkIntakeCsv,
  handleCreateEntity,
  handleCreateProject,
  handleCurate,
  handleDecideGate,
  handleAdvanceStage,
  handleGetEntity,
  handleGetProject,
  handleGetWorkflow,
  handleListProjectEntities,
  handleListProjects,
  handlePatchEntity,
  handlePatchProject,
  handleTriggerWorkflow,
} from "./projects";
import {
  handleUiConnectCode,
  handleUiMessages,
  handleUiMessagesRead,
  handleUiSettings,
  handleUiUnbind,
} from "./settings";
import {
  handleUiAdvanceStage,
  handleUiBoard,
  handleUiBulkIntake,
  handleUiCreateEntity,
  handleUiCreateProject,
  handleUiCurate,
  handleUiDecideGate,
  handleUiDrafts,
  handleUiGetProject,
  handleUiListEntities,
  handleUiListProjects,
  handleUiSetRowContact,
  handleUiTriggerWorkflow,
  handleUiVenueContact,
  handleUiVenueSearch,
} from "./ui";

type Handler = (request: Request, ...params: string[]) => Response | Promise<Response>;

/** One dispatch row: method + exact-or-parametric path + handler. */
interface Route {
  method: string;
  /** Path segments; `:name` captures one segment. */
  parts: string[];
  handle: Handler;
}

function route(method: string, path: string, handle: Handler): Route {
  return { method, parts: segments(path), handle };
}

const routes: Route[] = [
  // Bearer surface (api keys): projects, entities, workflows, bulk csv.
  route("GET", "/api/projects", handleListProjects),
  route("POST", "/api/projects", handleCreateProject),
  route("GET", "/api/projects/:projectId", handleGetProject),
  route("PATCH", "/api/projects/:projectId", handlePatchProject),
  route("GET", "/api/projects/:projectId/entities", handleListProjectEntities),
  route("POST", "/api/projects/:projectId/entities", handleCreateEntity),
  route("POST", "/api/projects/:projectId/entities/bulk", handleBulkIntakeCsv),
  route("POST", "/api/projects/:projectId/stage", handleAdvanceStage),
  route("POST", "/api/projects/:projectId/approve", handleDecideGate),
  route("POST", "/api/projects/:projectId/curate", handleCurate),
  route("POST", "/api/projects/:projectId/workflows", handleTriggerWorkflow),
  route("GET", "/api/entities/:entityId", handleGetEntity),
  route("PATCH", "/api/entities/:entityId", handlePatchEntity),
  route("GET", "/api/workflows/:runId", handleGetWorkflow),
  route("GET", "/api/api-keys", handleListApiKeys),
  route("POST", "/api/api-keys", handleCreateApiKey),
  route("DELETE", "/api/api-keys/:id", handleRevokeApiKey),
  route("POST", "/api/access-requests", handleAccessRequest),

  // Session surface (/api/ui/*): same paths the browser uses.
  route("GET", "/api/ui/projects", handleUiListProjects),
  route("POST", "/api/ui/projects", handleUiCreateProject),
  route("GET", "/api/ui/projects/:projectId", handleUiGetProject),
  route("GET", "/api/ui/projects/:projectId/entities", handleUiListEntities),
  route("GET", "/api/ui/projects/:projectId/board", handleUiBoard),
  route("GET", "/api/ui/projects/:projectId/drafts", handleUiDrafts),
  route("POST", "/api/ui/projects/:projectId/entities", handleUiCreateEntity),
  route("PATCH", "/api/ui/projects/:projectId/entities/:entityId/contact", handleUiSetRowContact),
  route("POST", "/api/ui/projects/:projectId/entities/bulk", handleUiBulkIntake),
  route("POST", "/api/ui/projects/:projectId/workflows", handleUiTriggerWorkflow),
  route("POST", "/api/ui/projects/:projectId/stage", handleUiAdvanceStage),
  route("POST", "/api/ui/projects/:projectId/approve", handleUiDecideGate),
  route("POST", "/api/ui/projects/:projectId/curate", handleUiCurate),
  route("POST", "/api/ui/venues/search", handleUiVenueSearch),
  route("PATCH", "/api/ui/venues/:venueId/contact", handleUiVenueContact),

  // Settings and inbox.
  route("GET", "/api/ui/settings", handleUiSettings),
  route("POST", "/api/ui/settings/connect-code", handleUiConnectCode),
  route("DELETE", "/api/ui/settings/bindings/:bindingId", handleUiUnbind),
  route("GET", "/api/ui/settings/messages", handleUiMessages),
  route("POST", "/api/ui/settings/messages/read", handleUiMessagesRead),

  // Auth (OTP) and the loopback admin inbox.
  route("POST", "/auth/request-otp", handleRequestOtp),
  route("POST", "/auth/verify-otp", handleVerifyOtp),
  route("GET", "/api/dev/login", handleDevLogin),
  route("GET", "/internal/admin/inbox", handleAdminInbox),

  route("GET", "/capabilities", handleCapabilities),
];

/** Match `parts` against the route table; return handler + path params. */
function match(method: string, parts: string[]): { handle: Handler; params: string[] } | undefined {
  for (const candidate of routes) {
    if (candidate.method !== method) continue;
    if (candidate.parts.length !== parts.length) continue;
    const params: string[] = [];
    let ok = true;
    for (let i = 0; i < parts.length; i++) {
      const pattern = candidate.parts[i]!;
      if (pattern.startsWith(":")) {
        params.push(parts[i]!);
      } else if (pattern !== parts[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { handle: candidate.handle, params };
  }
  return undefined;
}

/**
 * The composed api handler: a fetch-style function for the api/auth/
 * webhook/internal path space. Unknown paths answer 404 like Hono did;
 * unmatched methods on known paths answer 405.
 */
export function buildApiHandlers(): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/api/health") return Response.json({ ok: true });
    const found = match(request.method, segments(path));
    if (!found) return Response.json({ error: "not_found" }, { status: 404 });
    return found.handle(request, ...found.params);
  };
}
