import { type ToolDefinition } from "#tools/definition.js";
export interface GlobToolInput {
    limit?: number;
    path?: string;
    pattern: string;
}
export interface GlobToolOutput {
    content: string;
    count: number;
    path: string;
    truncated: boolean;
}
/**
 * Input schema for the provided `glob` tool.
 */
export declare const GLOB_INPUT_SCHEMA: import("#tools/schema.js").ToolSchema<GlobToolInput, GlobToolInput>;
/**
 * Output schema for the provided `glob` tool.
 */
export declare const GLOB_OUTPUT_SCHEMA: import("#tools/schema.js").ToolSchema<GlobToolOutput, GlobToolOutput>;
/**
 * Framework-owned executor that delegates to the default sandbox.
 */
export declare const glob: ToolDefinition<GlobToolInput, GlobToolOutput>;
export default glob;
