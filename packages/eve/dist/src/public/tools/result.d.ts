import type { CallObservation } from "#protocol/session-projection/observations.js";
import type { McpClientConnectionDefinition } from "#public/definitions/connections/mcp.js";
import type { OpenAPIConnectionDefinition } from "#public/definitions/connections/openapi.js";
import type { ToolDefinition } from "#tools/definition.js";
/**
 * Narrowed tool result returned by {@link toolResultFrom} when the
 * settled call matches an authored {@link ToolDefinition}.
 *
 * `TOutput` is inferred from the tool definition's `execute` return type.
 */
export interface MatchedToolResult<TOutput> {
    readonly callId: string;
    readonly output: TOutput;
    readonly toolName: string;
}
/**
 * Narrowed tool result returned by {@link toolResultFrom} when the
 * settled call matches an MCP or OpenAPI connection.
 *
 * `output` stays `unknown` because connection tool schemas are remote.
 * `connectionToolName` is the unqualified connection tool name (e.g.
 * `"list_issues"`) while `toolName` is the full qualified name
 * (e.g. `"linear__list_issues"`).
 */
export interface MatchedConnectionResult {
    readonly callId: string;
    readonly connectionToolName: string;
    readonly output: unknown;
    readonly toolName: string;
}
type ConnectionDefinition = McpClientConnectionDefinition | OpenAPIConnectionDefinition;
/** A call observation, such as `call(ctx.view, event.data.callId)`. Missing calls match nothing. */
export type ToolResultSource = Pick<CallObservation, "callId" | "kind" | "name" | "state" | "output"> | undefined;
/**
 * Overloaded signature for {@link toolResultFrom}.
 */
export interface ToolResultFromFn {
    <TInput, TOutput>(result: ToolResultSource, tool: ToolDefinition<TInput, TOutput>): MatchedToolResult<TOutput> | undefined;
    (result: ToolResultSource, connection: ConnectionDefinition): MatchedConnectionResult | undefined;
}
/**
 * Narrows a completed call observation to a typed tool or connection result by
 * matching against an authored definition object.
 *
 * Pass a `ToolDefinition` to get a typed `output`; pass an MCP or OpenAPI
 * connection definition to match any tool from that connection (`output`
 * stays `unknown`).
 *
 * Returns `undefined` when the call doesn't match, isn't a tool's, or
 * didn't complete.
 *
 * ```ts
 * "call.settled"(event, ctx) {
 *   const match = toolResultFrom(call(ctx.view, event.data.callId), weather);
 * }
 * ```
 */
export declare const toolResultFrom: ToolResultFromFn;
export {};
