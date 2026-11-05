import type { JsonValue } from "#shared/json.js";
import { type WorkflowTaskToolDefinition } from "#tools/workflow-definition.js";
export interface WorkflowToolOptions {
    /** Maximum child-agent calls per program, from 1 to 128. Defaults to 100. */
    readonly maxSubagents?: number;
}
export interface WorkflowToolInput {
    readonly js: string;
}
export type WorkflowTool = WorkflowTaskToolDefinition<WorkflowToolInput, JsonValue>;
/** Defines a model-facing workflow tool backed by isolated runtime JavaScript. */
export declare function workflow(options?: WorkflowToolOptions): WorkflowTool;
