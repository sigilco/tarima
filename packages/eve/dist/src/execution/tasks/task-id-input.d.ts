import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { JsonObject } from "#shared/json.js";
import { type ToolSchema } from "#tools/schema.js";
/** The model input property eve adds to every `serve` tool. */
export declare const TASK_ID_INPUT = "taskId";
/** A `serve` tool's input schema as the model sees it, with the optional `taskId`. */
export declare function withTaskIdSchema(schema: ToolSchema): ToolSchema;
/**
 * The tool as the model sees it: its input gains `taskId`, and its description
 * explains it. An agent tool also gets its activity label, the agent and the
 * first sentence of its message: `Researcher: Find the March incidents`.
 */
export declare function withTaskIdInput(definition: HarnessToolDefinition): HarnessToolDefinition;
/** A `serve` tool call's model input, split into the task it names and the tool's own input. */
export interface ServeCallInput {
    readonly input: JsonObject;
    readonly taskId?: string;
}
export declare function splitTaskIdInput(modelInput: JsonObject): ServeCallInput;
