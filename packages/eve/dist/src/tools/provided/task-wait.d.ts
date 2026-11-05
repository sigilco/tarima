import type { HarnessToolDefinition } from "#harness/execute-tool.js";
export interface TaskWaitInput {
    readonly timeoutSeconds?: number;
}
/**
 * `eve__task_wait`, offered to agents that can start tasks. It is not a workflow tool: the
 * call defers out of the model step and the session parks the turn itself.
 */
export declare const taskWaitTool: HarnessToolDefinition;
