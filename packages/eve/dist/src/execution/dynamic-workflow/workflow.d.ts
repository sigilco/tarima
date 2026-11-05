import { MAX_WORKFLOW_PROGRAM_MAX_SUBAGENTS } from "#execution/dynamic-workflow/schema.js";
import type { JsonValue } from "#shared/json.js";
import type { WorkflowToolContext } from "#tools/workflow-definition.js";
export interface JsProgramOptions {
    /** Maximum child-agent calls, from 1 to 128. Defaults to 100. */
    readonly maxSubagents?: number;
}
/** Runs a model-generated JavaScript function body inside an isolated workflow sandbox. */
export declare function runJsProgram(js: string, ctx: WorkflowToolContext, options: JsProgramOptions): Promise<JsonValue>;
export { MAX_WORKFLOW_PROGRAM_MAX_SUBAGENTS };
