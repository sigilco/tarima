import type { WorkflowToolContext } from "#public/tools/index.js";
import type { SleepToolInput, SleepToolOutput } from "#tools/provided/sleep.js";
/** Waits durably, and stops early when a new message arrives. */
export declare function executeSleepTool(input: SleepToolInput, ctx: WorkflowToolContext): Promise<SleepToolOutput>;
