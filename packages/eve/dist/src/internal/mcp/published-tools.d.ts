import type { AgentToolDescription } from "#channel/agent-description.js";
import type { InvokeToolFn } from "#channel/invoke-tool.js";
import type { McpRequestPrincipals } from "#internal/mcp/forwarded-principal-header.js";
import { type McpServerTool } from "#internal/mcp/streamable-http-server.js";
/** Extension a client declares to join tool sessions with `_meta["dev.eve/tool-session"]`. */
export declare const MCP_TOOL_SESSIONS_EXTENSION = "dev.eve/tool-sessions";
/** `_meta` key carrying a `tools/call`'s tool session key. */
export declare const MCP_TOOL_SESSION_META_KEY = "dev.eve/tool-session";
/**
 * The agent's invocable tools as MCP tools. Each `tools/call` runs the tool
 * through `invokeTool` as `principals`: the route-authenticated caller, or the
 * user a trusted forwarder named. Tools named like one in `reserved` are
 * skipped, since the channel serves that name itself.
 */
export declare function createPublishedTools(input: {
    readonly invokeTool: InvokeToolFn;
    readonly principals: McpRequestPrincipals;
    readonly reserved: ReadonlySet<string>;
    readonly tools: readonly AgentToolDescription[];
}): McpServerTool[];
