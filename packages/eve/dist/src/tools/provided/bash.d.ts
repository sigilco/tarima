import { type ToolDefinition } from "#tools/definition.js";
export interface BashToolInput {
    command: string;
    /**
     * Seconds to wait for the command before it keeps running in the
     * background. Defaults to 30; values outside 1–120 are clamped.
     */
    timeout?: number;
}
/**
 * Output of the provided `bash` tool. A command that finishes within the wait
 * (30 seconds, or the input's `timeout`) is `completed`. A longer command keeps
 * running in the sandbox as process group `pid` and returns `running` with its
 * output so far; it keeps writing `stdout`, `stderr`, and finally `exit` files
 * in `outputDirectory`.
 */
export type BashToolOutput = {
    status: "completed";
    exitCode: number;
    stderr: string;
    stdout: string;
    truncated: boolean;
} | {
    status: "running";
    pid: number;
    outputDirectory: string;
    message: string;
    stderr: string;
    stdout: string;
    truncated: boolean;
};
/**
 * Input schema for the provided `bash` tool.
 */
export declare const BASH_INPUT_SCHEMA: import("#tools/schema.js").ToolSchema<BashToolInput, BashToolInput>;
/**
 * Output schema for the provided `bash` tool.
 */
export declare const BASH_OUTPUT_SCHEMA: import("#tools/schema.js").ToolSchema<BashToolOutput, BashToolOutput>;
/**
 * Framework-owned executors stay statically imported so hosted server bundles
 * can trace and rewrite them into deployable output chunks.
 *
 * These modules are only used by the Nitro-hosted runtime path. Their deeper
 * sandbox dependencies remain lazily loaded inside the execution layer, so the
 * top-level import here does not force those backends to initialize eagerly.
 */
export declare const bash: ToolDefinition<BashToolInput, BashToolOutput>;
export default bash;
