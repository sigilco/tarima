import { type MCPClient } from "#compiled/@ai-sdk/mcp/index.js";
import type { ResolvedConnectionDefinition } from "#runtime/types.js";
import type { ConnectionClient, ConnectionToolExecuteOptions, ConnectionToolMetadata, ToolFilterDefinition } from "#shared/connection-types.js";
/**
 * Wraps one `MCPClient` from `@ai-sdk/mcp` for a single connection.
 *
 * Created lazily per connection per step. Caches tool metadata after
 * the first `getToolMetadata()` call.
 *
 * When the connection declares `authorization` but no token is available
 * yet (`getToken` throws {@link ConnectionAuthorizationRequiredError}), the
 * client connects anonymously instead of failing. Sign-in is only requested
 * once the server asks for it: an HTTP `401` on any request, or a tool
 * result that carries an `mcp/www_authenticate` challenge.
 */
export declare class McpConnectionClient implements ConnectionClient {
    #private;
    readonly eventActions: ConnectionClient["eventActions"];
    constructor(connection: ResolvedConnectionDefinition);
    /**
     * Connects to the MCP server, trying Streamable HTTP first and
     * falling back to SSE for transport-compatibility failures.
     *
     * Concurrent callers share the same connection promise to avoid
     * duplicate connections.
     */
    connect(): Promise<MCPClient>;
    /**
     * Returns cached tool metadata for all tools this connection exposes. The
     * catalog applies the connection's tool filter to the listing.
     *
     * The first call fetches tools from the server via `listTools()` and
     * creates the AI SDK tool set in parallel. Subsequent calls return
     * the cached result. Concurrent callers share the same in-flight
     * promise.
     */
    getToolMetadata(): Promise<readonly ConnectionToolMetadata[]>;
    /**
     * Executes a named tool through the AI SDK's tool executor, which
     * handles the JSON-RPC `tools/call` internally.
     *
     * A `401`/`invalid_token` from the remote server is translated into
     * {@link ConnectionAuthorizationRequiredError} via {@link #rethrowClassified}
     * so callers re-enter the authorization flow instead of surfacing an
     * opaque transport error. A tool error result carrying an
     * `_meta["mcp/www_authenticate"]` challenge is treated the same way.
     */
    executeTool(toolName: string, args: unknown, options: ConnectionToolExecuteOptions): Promise<unknown>;
    close(): Promise<void>;
}
/**
 * Returns `true` when an error from the MCP transport indicates the
 * bearer was rejected by the remote server — an HTTP `401`. Per
 * RFC 6750 a `401` means the access token is missing, expired, or
 * revoked, all of which are recoverable by re-authorizing. (A `403`
 * is an insufficient-scope / permission problem and is intentionally
 * left to propagate, since re-running the same grant would not help.)
 */
export declare function isMcpAuthRequiredError(error: unknown): boolean;
/** `_meta` key a tool result uses to ask for sign-in (OpenAI Apps SDK convention). */
export declare const MCP_WWW_AUTHENTICATE_META_KEY = "mcp/www_authenticate";
/**
 * Returns `true` for a `tools/call` error result that asks the client to
 * sign in: `isError: true` plus a non-empty `_meta["mcp/www_authenticate"]`
 * (a `WWW-Authenticate` challenge string or list of them). Servers that
 * accept anonymous `initialize`/`tools/list` use this to protect individual
 * tools without failing the whole HTTP request.
 */
export declare function isMcpAuthChallengeResult(result: unknown): boolean;
export declare function readHttpStatus(error: unknown): number | undefined;
/**
 * Returns `true` when a tool passes the configured filter. A tool may be known
 * by more than one name, such as an OpenAPI tool's name and the `operationId`
 * it was derived from; `allow` admits it when any name is listed, and `block`
 * hides it when any name is listed.
 */
export declare function passesToolFilter(names: readonly string[], filter: Readonly<ToolFilterDefinition> | undefined): boolean;
/**
 * Merges `authorization` (Bearer token) and `headers` into one
 * flat `Record<string, string>` for the transport layer.
 *
 * Resolves dynamic `auth` and `headers` callbacks with the active
 * session context, then resolves the {@link ConnectionPrincipal}
 * and invokes `authorization.getToken({ principal })` to produce the bearer.
 * `getToken` may throw {@link ConnectionAuthorizationRequiredError};
 * callers catch it and it propagates as-is from here.
 */
export declare function resolveHeaders(connection: ResolvedConnectionDefinition): Promise<Record<string, string>>;
