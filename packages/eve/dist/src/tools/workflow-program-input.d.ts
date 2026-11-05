import type { WorkflowProgramOptions } from "#execution/dynamic-workflow/schema.js";
import type { JsonObject } from "#shared/json.js";
export type { WorkflowProgramOptions } from "#execution/dynamic-workflow/schema.js";
export declare function attachWorkflowProgramOptions<TDefinition extends object>(definition: TDefinition, options: WorkflowProgramOptions): TDefinition;
export declare function readWorkflowProgramOptions(value: unknown): WorkflowProgramOptions | undefined;
export declare function createWorkflowProgramExecuteInput(options: WorkflowProgramOptions, input: unknown): JsonObject;
