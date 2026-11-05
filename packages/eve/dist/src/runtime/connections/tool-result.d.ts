/**
 * The value a connection tool call returns: what the model receives for the
 * call and what a code mode program receives later.
 *
 * - MCP results return `structuredContent` when present, otherwise their text,
 *   parsed as JSON when the tool declares no output schema. Results with image,
 *   audio, or resource content return their MCP `content` blocks, which
 *   {@link connectionToolModelOutput} turns into file parts.
 * - MCP results with `isError: true` become an error carrying their text.
 * - OpenAPI results pass through as `{ status, statusText, body }`.
 */
import type { ToolModelOutput } from "#tools/model-output.js";
import type { ConnectionToolMetadata } from "#shared/connection-types.js";
export type ConnectionToolResult = {
    readonly ok: true;
    readonly value: unknown;
} | {
    readonly ok: false;
    readonly error: string;
};
export declare function toConnectionToolResult(protocol: "mcp" | "openapi", tool: ConnectionToolMetadata, raw: unknown): ConnectionToolResult;
/**
 * Projects a {@link toConnectionToolResult} value for the model: MCP content
 * blocks become text and file parts, strings stay text, and anything else is
 * JSON.
 */
export declare function connectionToolModelOutput(output: unknown): ToolModelOutput;
