/**
 * MCP endpoint: POST /mcp, stateless JSON-RPC 2.0.
 *
 * The endpoint is the machine-facing twin of the REST surface. Every
 * tool delegates to the SAME service functions the REST routes use, so
 * `projects.create` over MCP produces the same project a
 * `POST /api/projects` would. The tool names and their argument
 * schemas come from `@tarima/contract` (`mcpToolNames`, `mcpToolSchemas`)
 * so the catalog cannot drift from the contract.
 *
 * Conventions (MCP, not JSON-RPC):
 *   - a tool call that fails validation or lacks a scope answers with a
 *     successful JSON-RPC envelope whose result carries `isError: true`
 *     and a text content block. It is NOT an HTTP 400: the transport
 *     succeeded, the operation did not.
 *   - `notifications/initialized` is a notification (no id): HTTP 202
 *     with an empty body.
 *   - an unknown method is a JSON-RPC error -32601 with HTTP 200.
 *   - GET and DELETE on /mcp are 405: the endpoint is POST only.
 */
import { Hono } from "hono";
import * as v from "valibot";
import { mcpToolNames, mcpToolSchemas, type McpToolName } from "@tarima/contract";
import { toJsonSchema } from "../lib/valibot-json-schema";
import { bearerToken, verifyApiKey } from "../services/api-key-auth";
import { hasScope } from "../services/scopes";
import { runTool, TOOL_DESCRIPTIONS, TOOL_SCOPES } from "../services/tools";

/** The MCP protocol revision this server implements. */
const PROTOCOL_VERSION = "2024-11-05";

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

/** A JSON-RPC response envelope. */
function ok(id: string | number | null, result: unknown): Response {
  return Response.json({ jsonrpc: "2.0", id, result });
}

/** A JSON-RPC error envelope. */
function fail(id: string | number | null, code: number, message: string): Response {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } });
}

/** A tool result: a text content block holding the JSON value. */
function toolResult(id: string | number | null, value: unknown, isError = false): Response {
  return ok(id, {
    content: [{ type: "text", text: JSON.stringify(value) }],
    isError,
  });
}

/** The tool catalog published by tools/list. */
function toolCatalog(): Array<{ name: string; description: string; inputSchema: unknown }> {
  return mcpToolNames.map((name) => ({
    name,
    description: TOOL_DESCRIPTIONS[name],
    inputSchema: toJsonSchema(mcpToolSchemas[name]),
  }));
}

export const mcpRoutes = new Hono()
  .get("/mcp", (c) => c.json({ error: "method_not_allowed" }, 405))
  .delete("/mcp", (c) => c.json({ error: "method_not_allowed" }, 405))
  .post("/mcp", async (c) => {
    // Auth: a valid Bearer key is required. The tool's own scope is
    // checked per call, so a key only needs to be valid to reach
    // tools/list.
    const token = bearerToken(c.req.raw);
    const verified = token ? verifyApiKey(token) : null;
    if (!verified) return c.json({ error: "unauthorized" }, 401);

    const body = (await c.req.json().catch(() => null)) as JsonRpcRequest | null;
    if (!body || typeof body !== "object" || typeof body.method !== "string") {
      return fail(body?.id ?? null, -32600, "Invalid Request");
    }

    const id = body.id ?? null;

    switch (body.method) {
      case "initialize":
        return ok(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: "tarima", version: "0.1.0" },
        });

      case "notifications/initialized":
        // A notification has no id and expects no body.
        return c.body(null, 202);

      case "tools/list":
        return ok(id, { tools: toolCatalog() });

      case "tools/call": {
        const params = body.params ?? {};
        const name = params.name;
        if (typeof name !== "string" || !isMcpToolName(name)) {
          return toolResult(id, { error: "unknown_tool", name: String(name) }, true);
        }

        const requiredScope = TOOL_SCOPES[name];
        if (!hasScope(verified.scopes, [requiredScope])) {
          return toolResult(id, { error: "forbidden", requiredScope }, true);
        }

        const parsed = v.safeParse(
          mcpToolSchemas[name],
          (params.arguments ?? {}) as Record<string, unknown>,
        );
        if (!parsed.success) {
          return toolResult(id, { error: "invalid_request", issues: parsed.issues }, true);
        }

        try {
          return toolResult(id, runTool(name, parsed.output as Record<string, unknown>));
        } catch (err) {
          return toolResult(
            id,
            { error: "tool_failed", message: err instanceof Error ? err.message : String(err) },
            true,
          );
        }
      }

      default:
        return fail(id, -32601, "Method not found");
    }
  });

/** True when the name is one of the contract's tool names. */
function isMcpToolName(name: string): name is McpToolName {
  return (mcpToolNames as readonly string[]).includes(name);
}
