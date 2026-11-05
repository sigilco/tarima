import type { HarnessToolDefinition } from "#harness/execute-tool.js";
export interface TaskCancelInput {
    readonly taskId: string;
}
/** `eve__task_cancel`, offered to agents that can start tasks; the session answers each call. */
export declare const taskCancelTool: HarnessToolDefinition;
