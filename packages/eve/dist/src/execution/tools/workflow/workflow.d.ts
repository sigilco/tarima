import type { WorkflowToolRunInput } from "#execution/tools/workflow/types.js";
/** Owns command intake, body execution, and settlement for one workflow tool call. */
export declare function workflowToolRunWorkflow(input: WorkflowToolRunInput): Promise<void>;
