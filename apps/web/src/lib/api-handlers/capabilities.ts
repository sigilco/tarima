/**
 * Capabilities catalog handler: GET /capabilities (public, unauthenticated).
 * Ported from apps/api/src/routes/capabilities.ts, unchanged logic.
 */
import { mcpToolNames, mcpToolSchemas } from "@tarima/contract";
import { API_SCOPES } from "@tarima/api/services/scopes";
import { TOOL_DESCRIPTIONS, TOOL_SCOPES } from "@tarima/api/services/tools";
import { toJsonSchema } from "@tarima/api/lib/valibot-json-schema";

/** One route of the api surface. */
export interface RouteDescriptor {
  method: string;
  path: string;
  scopes: string[];
}

/**
 * The route table. Every entry lists the scopes that grant access; an
 * empty list means the route needs no API key (public) or needs no
 * specific scope beyond being a valid key.
 */
const CAPABILITY_ROUTES: RouteDescriptor[] = [
  { method: "GET", path: "/api/health", scopes: [] },
  { method: "POST", path: "/api/access-requests", scopes: [] },
  { method: "GET", path: "/api/api-keys", scopes: ["api-keys:read"] },
  { method: "POST", path: "/api/api-keys", scopes: ["api-keys:write"] },
  { method: "DELETE", path: "/api/api-keys/:id", scopes: ["api-keys:write"] },
  { method: "GET", path: "/api/projects", scopes: ["projects:read"] },
  { method: "POST", path: "/api/projects", scopes: ["projects:write"] },
  { method: "GET", path: "/api/projects/:projectId", scopes: ["projects:read"] },
  { method: "PATCH", path: "/api/projects/:projectId", scopes: ["projects:write"] },
  { method: "GET", path: "/api/projects/:projectId/entities", scopes: ["entities:read"] },
  { method: "POST", path: "/api/projects/:projectId/entities", scopes: ["entities:write"] },
  { method: "GET", path: "/api/entities/:entityId", scopes: ["entities:read"] },
  { method: "PATCH", path: "/api/entities/:entityId", scopes: ["entities:write"] },
  { method: "POST", path: "/api/projects/:projectId/workflows", scopes: ["workflows:write"] },
  { method: "GET", path: "/api/workflows/:runId", scopes: ["workflows:read"] },
  { method: "GET", path: "/capabilities", scopes: [] },
  { method: "POST", path: "/mcp", scopes: ["any"] },
];

/** The MCP tool catalog. */
export interface McpToolDescriptor {
  name: string;
  description: string;
  args: unknown;
  scope: string;
}

/** The tool list, sorted by name. */
function capabilityTools(): McpToolDescriptor[] {
  return [...mcpToolNames].toSorted().map((name) => ({
    name,
    description: TOOL_DESCRIPTIONS[name],
    args: toJsonSchema(mcpToolSchemas[name]),
    scope: TOOL_SCOPES[name],
  }));
}

/** The full catalog payload. Every list is sorted for a stable diff. */
export function capabilitiesPayload(): {
  routes: RouteDescriptor[];
  mcpTools: McpToolDescriptor[];
  scopes: string[];
} {
  return {
    routes: [...CAPABILITY_ROUTES].toSorted(
      (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
    ),
    mcpTools: capabilityTools(),
    scopes: [...API_SCOPES].toSorted(),
  };
}

/** GET /capabilities */
export function handleCapabilities(): Response {
  return Response.json(capabilitiesPayload());
}
