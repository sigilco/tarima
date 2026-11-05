import { type GrepToolInput, type GrepSearchResult as GrepToolOutput } from "#execution/sandbox/grep-search.js";
import { type ToolDefinition } from "#tools/definition.js";
export type { GrepToolInput, GrepToolOutput };
/**
 * Input schema for the provided `grep` tool.
 */
export declare const GREP_INPUT_SCHEMA: import("#tools/schema.js").ToolSchema<GrepToolInput, GrepToolInput>;
/**
 * Output schema for the provided `grep` tool.
 */
export declare const GREP_OUTPUT_SCHEMA: import("#tools/schema.js").ToolSchema<GrepToolOutput, GrepToolOutput>;
/**
 * Framework-owned executor that delegates to the default sandbox.
 */
export declare const grep: ToolDefinition<GrepToolInput, GrepToolOutput>;
export default grep;
