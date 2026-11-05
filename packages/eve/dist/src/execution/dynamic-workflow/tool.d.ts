import type { JsonValue } from "#shared/json.js";
import type { WorkflowToolContext } from "#tools/workflow-definition.js";
export interface WorkflowProgramToolInput {
    readonly js: string;
    readonly maxSubagents?: number;
}
/** Static workflow executor used by the provided `workflow` tool. */
export declare function runWorkflowProgramTask(input: WorkflowProgramToolInput, ctx: WorkflowToolContext): Promise<JsonValue>;
