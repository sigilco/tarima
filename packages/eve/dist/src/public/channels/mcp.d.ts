import { type Channel } from "#public/definitions/channel.js";
import type { TrustedForwarders } from "#channel/forwarded-principal.js";
import { type AuthFn } from "#public/channels/auth.js";
export interface McpChannelConfig {
    /** Existing eve route-auth policy. Use `none()` for explicit public access. */
    readonly auth: AuthFn<Request> | readonly AuthFn<Request>[];
    /** Override the default MCP route path (`/eve/v1/mcp`). */
    readonly route?: string;
    /**
     * Serve the `agent_*` tools, which start and follow a durable agent task.
     * With `false`, the channel serves only what `tools` and `skills` publish.
     * @default true
     */
    readonly agent?: boolean;
    /**
     * Also publish the agent's invocable tools, each `tools/call` running the
     * tool as the route-authenticated caller. While `agent` is on, an agent
     * tool named like an `agent_*` tool is not published. Also advertises the
     * `dev.eve/tool-sessions` extension: a client that declares it joins a tool
     * session by sending `_meta["dev.eve/tool-session"]` on `tools/call`.
     * @default false
     */
    readonly tools?: boolean;
    /**
     * Lets a route-authenticated forwarder, such as another eve agent's
     * `forwardPrincipal` connection, run the published tools as a user it names
     * in the `eve-forwarded-principal` header. Receives the verified forwarder
     * and what it asserts, as eveChannel's `trustedForwarders` does; match the
     * forwarder precisely. Accepted principals carry the forwarder's id as the
     * `eve:forwarded-by` attribute. `agent_*` tools still act as the route
     * caller. Omit to refuse any request carrying the header with 403.
     */
    readonly trustedForwarders?: TrustedForwarders;
    /**
     * Also serve the agent's skills as SEP-2640 skills under `skill://`
     * (`skills/list`, `skills/get`, and the `resources/*` methods), readable
     * by every route-authenticated caller.
     * @default false
     */
    readonly skills?: boolean;
}
/** Public MCP channel publishing this agent's `agent_*` tools and, optionally, its tools and skills. */
export type McpChannel = Channel;
/**
 * Publishes this agent as a stateless Streamable HTTP MCP server.
 *
 * This channel owns MCP transport, durable eve invocation through the
 * `agent_*` tools (unless `agent: false`), with `tools: true` the agent's
 * invocable tools, each call run through `invokeTool`, and with
 * `skills: true` the agent's skills and their files. It reuses
 * eve's inbound auth strategies and recognizes `oauthResource(...)` metadata
 * when OAuth discovery is needed.
 * The file containing this channel must be `agent/channels/mcp.ts`.
 */
export declare function mcpChannel(input: McpChannelConfig): McpChannel;
