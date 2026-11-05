import type { PreparedToolHandling } from "#tools/behavior.js";
export declare const AGENT_TOOL_SERVE_WORKFLOW_NAME = "agentToolServeWorkflow";
/** The framework-owned `serve` body of every agent tool. */
export declare const agentToolServeWorkflowReference: {
    workflowId: string;
};
/** Registered workflow that runs a tool with this handling; absent for tools without one. */
export declare function workflowIdForHandling(handling: PreparedToolHandling | undefined): string | undefined;
