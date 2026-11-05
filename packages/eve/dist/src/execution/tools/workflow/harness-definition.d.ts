import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { PreparedRuntimeTool } from "#runtime/sessions/turn.js";
import type { JsonValue } from "#shared/json.js";
export interface WorkflowToolHarnessDefinitionInput {
    readonly definition: HarnessToolDefinition;
    readonly executeInput?: (input: unknown) => JsonValue;
    readonly workflowId: string;
}
/**
 * Workflow tools run outside the model step, so the harness definition carries
 * no `execute`. A `serve` tool's model input gains `taskId`.
 */
export declare function createWorkflowToolHarnessDefinition(input: WorkflowToolHarnessDefinitionInput): HarnessToolDefinition;
export declare function createPreparedWorkflowToolHarnessDefinition(tool: PreparedRuntimeTool): HarnessToolDefinition;
