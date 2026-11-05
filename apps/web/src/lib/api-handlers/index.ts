/**
 * The in-process api dispatcher: one fetch-style function that routes
 * every api/auth/webhook/internal path to the plain (Request => Response)
 * handlers in this directory.
 *
 * SP7 teardown: the bearer surface (`/api/projects`, `/api/entities`,
 * `/api/workflows`, `/api/api-keys`) went away with the legacy UI; the
 * session surface (`/api/ui/*`) is trimmed to what the new workspace
 * shell and the proof harnesses still call.
 */
import { handleAccessRequest } from "./access-requests";
import { handleAgentTurn } from "./agent-turn";
import { handleAdminInbox, handleRequestOtp, handleVerifyOtp } from "./auth";
import { handleCapabilities } from "./capabilities";
import { handleDevLogin } from "./dev-login";
import { handleEveProxy } from "./eve-proxy";
import { segments } from "./helpers";
import { handleUiConnectCode } from "./settings";
import {
  handleUiCreateEntity,
  handleUiCreateProject,
  handleUiGetProject,
  handleUiListEntities,
  handleUiListProjects,
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
  route("POST", "/api/access-requests", handleAccessRequest),
  route("POST", "/api/agent/turn", handleAgentTurn),

  // Session surface (/api/ui/*): what the workspace shell and the proof
  // harnesses call.
  route("GET", "/api/ui/projects", handleUiListProjects),
  route("POST", "/api/ui/projects", handleUiCreateProject),
  route("GET", "/api/ui/projects/:projectId", handleUiGetProject),
  route("GET", "/api/ui/projects/:projectId/entities", handleUiListEntities),
  route("POST", "/api/ui/projects/:projectId/entities", handleUiCreateEntity),
  route("POST", "/api/ui/settings/connect-code", handleUiConnectCode),

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
    // The eve HTTP channel proxy: /api/eve/* streams to the in-process
    // eve runtime (see eve-proxy.ts). Checked before the route table
    // because it matches a whole prefix, any method.
    if (path.startsWith("/api/eve/")) return handleEveProxy(request);
    const found = match(request.method, segments(path));
    if (!found) return Response.json({ error: "not_found" }, { status: 404 });
    return found.handle(request, ...found.params);
  };
}
