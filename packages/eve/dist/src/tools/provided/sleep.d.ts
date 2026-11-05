import { type WorkflowExecuteToolDefinition } from "#public/tools/index.js";
import { type InterruptedOutput } from "#tools/provided/interrupted.js";
export interface SleepToolInput {
    seconds: number;
}
export type SleepToolOutput = {
    waitedSeconds: number;
} | InterruptedOutput;
export declare const SLEEP_INPUT_SCHEMA: import("#tools/schema.js").ToolSchema<SleepToolInput, SleepToolInput>;
/**
 * Defines the opt-in durable `sleep` tool.
 *
 * Export it from `agent/tools/sleep.ts`:
 *
 * ```ts
 * import { sleep } from "eve/tools/sleep";
 *
 * export default sleep;
 * ```
 *
 * Each call runs as a durable workflow, so the wait does not hold an
 * application runtime open. A new message ends the wait early.
 */
export declare const sleep: WorkflowExecuteToolDefinition<SleepToolInput, SleepToolOutput>;
