import { McpServer, type McpJsonObject, type McpToolAnnotations, type StandardSchemaWithJSON } from "#compiled/@modelcontextprotocol/server/index.js";
import type { SessionAuthContext } from "#channel/types.js";
export declare const MCP_PROTOCOL_VERSION = "2026-07-28";
/**
 * Upper bound for any MCP POST body. Tool arguments are small JSON; the
 * largest legitimate payload is an `outputSchema`, itself capped at 64 KiB.
 */
export declare const MCP_REQUEST_BODY_MAX_BYTES: number;
/**
 * Cache hint for the tool lists, skill lists, and skill reads eve serves.
 * They are fixed per deployment, but clients cache per URL, and a production
 * alias serves a new deployment under the same URL, so the TTL is how long a
 * client may see the old lists after a deploy. `private`: route auth
 * admitted this caller, and a shared cache cannot rerun it for the next one.
 */
export declare const MCP_LIST_CACHE_HINT: {
    readonly cacheScope: "private";
    readonly ttlMs: number;
};
interface McpToolDefinition<TInputSchema extends StandardSchemaWithJSON = StandardSchemaWithJSON> {
    readonly name: string;
    readonly description?: string;
    readonly annotations?: McpToolAnnotations;
    readonly inputSchema: TInputSchema;
    readonly outputSchema?: StandardSchemaWithJSON;
}
/**
 * `TStructured` is any JSON value: 2026 clients accept non-object structured
 * content, and the SDK wraps it as `{ result }` for 2025 clients.
 */
export interface McpCallToolResult<TStructured = Readonly<Record<string, unknown>>> {
    readonly content: readonly McpContent[];
    readonly isError?: boolean;
    readonly structuredContent?: TStructured | McpToolOperationErrorEnvelope;
}
export interface McpToolOperationErrorEnvelope {
    readonly error: McpToolOperationErrorData;
}
export type McpContent = {
    readonly type: "text";
    readonly text: string;
} | {
    readonly type: "resource_link";
    readonly name: string;
    readonly uri: string;
};
/**
 * Stable, client-actionable reason a tool call was rejected before it could
 * return a result. `invalid_input` and `conflict` mean the caller should
 * change or re-read something; `not_found` means stop; `internal` means the
 * server failed and `errorId` correlates with its logs.
 */
type McpToolOperationErrorCode = "invalid_input" | "not_found" | "conflict" | "denied" | "approval_required" | "authorization_required" | "internal";
interface McpToolOperationErrorData {
    readonly code: McpToolOperationErrorCode;
    readonly errorId?: string;
    readonly message: string;
    readonly retryable: boolean;
}
/** Thrown by tool handlers to produce a structured `isError` result. */
export declare class McpToolOperationError extends Error {
    readonly code: McpToolOperationErrorCode;
    constructor(code: McpToolOperationErrorCode, message: string);
}
/** What a tool handler sees of one `tools/call`. */
export interface McpToolCallContext {
    readonly auth: SessionAuthContext | null;
    /**
     * The capabilities a 2026-07-28 request declared in its envelope. 2025-era
     * requests declare none per request, so they get `undefined`.
     */
    readonly clientCapabilities: unknown;
    /** The request's `_meta`, without the reserved `io.modelcontextprotocol/*` keys. */
    readonly meta: Readonly<Record<string, unknown>> | undefined;
    readonly signal: AbortSignal;
}
export interface McpServerTool {
    readonly name: string;
    register(server: McpServer, auth: SessionAuthContext | null): void;
}
/**
 * A set of MCP handlers beside the tools, such as skills. Every request
 * builds a fresh server, so `register` runs once per request, after
 * `capabilities` are merged one level deep into the server's own.
 * Declaring a capability obliges `register` to set its handlers.
 */
export interface McpServerFeature {
    readonly capabilities: McpJsonObject;
    register(server: McpServer): void;
}
type InferSchemaOutput<TSchema> = TSchema extends StandardSchemaWithJSON<unknown, infer TOutput> ? TOutput : never;
/** Keeps a schema and its inferred handler input coupled while erasing heterogeneous storage. */
export declare function defineMcpTool<const TInputSchema extends StandardSchemaWithJSON<unknown, unknown>, TStructured = Readonly<Record<string, unknown>>>(input: {
    readonly definition: McpToolDefinition<TInputSchema>;
    call(value: InferSchemaOutput<TInputSchema>, context: McpToolCallContext): Promise<McpCallToolResult<TStructured>>;
}): McpServerTool;
interface McpStreamableHttpServerOptions {
    readonly name: string;
    readonly version: string;
    /** Server-level usage guidance returned from `initialize` and `server/discover`. */
    readonly instructions?: string;
    /** When set, the server declares `tools`, even for an empty list. */
    readonly tools?: readonly McpServerTool[];
    readonly features?: readonly McpServerFeature[];
    authenticate(request: Request): Promise<SessionAuthContext | null | Response>;
}
/**
 * Creates a dual-era, stateless MCP HTTP request handler.
 *
 * Current clients use MCP 2026-07-28's per-request envelope. Older clients
 * fall back to the SDK's stateless 2025 Streamable HTTP implementation.
 */
export declare function createMcpStreamableHttpServer(options: McpStreamableHttpServerOptions): (request: Request) => Promise<Response>;
export {};
