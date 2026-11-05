import { type WorkflowToolEntryPoint } from "#tools/workflow-definition.js";
import type { JsonObject } from "#shared/json.js";
import { type WebSearchSelection } from "#shared/web-search.js";
import type { InternalToolDefinition, ToolExecuteFn } from "#tools/definition.js";
import { type CompiledToolBehavior } from "#tools/behavior.js";
import { type WorkflowProgramOptions } from "#tools/workflow-program-input.js";
/**
 * Canonical normalized shape of one authored tool default export.
 *
 * Identity is path-derived — the compiler stamps the filename slug onto
 * the compiled entry. This shape never carries an authored `name`.
 */
type NormalizedAuthoredTool = Readonly<Omit<InternalToolDefinition, "name"> & {
    readonly behavior?: CompiledToolBehavior;
    readonly execute?: ToolExecuteFn;
    readonly hasApproval: boolean;
    readonly hasExecute: boolean;
    readonly hasModelOutputProjection: boolean;
    /** The input schema as eve sends it to a model, from the live authored schema. */
    readonly modelInputSchema: JsonObject;
    readonly workflow?: CompiledWorkflowEntry;
    readonly workflowProgram?: WorkflowProgramOptions;
}>;
/** The compiled entry point of a `defineWorkflowTool()` definition. */
interface CompiledWorkflowEntry {
    readonly entryPoint: WorkflowToolEntryPoint;
    readonly workflowId: string;
}
/**
 * Result of normalizing one authored tool default export. Either a real tool
 * definition, a sentinel that disables a framework default, or a dynamic
 * tool resolver. In all cases the disable target / runtime name is the
 * authored file's slug, supplied by the compiler — this layer never sees
 * a name.
 */
type NormalizedToolEntry = {
    readonly kind: "tool";
    readonly definition: NormalizedAuthoredTool;
} | {
    readonly kind: "disabled";
} | {
    readonly kind: "web-search-tool";
    readonly selection: WebSearchSelection;
} | {
    readonly kind: "dynamic-tool";
};
/**
 * Normalizes one authored tool default export. Recognizes real tool
 * definitions (`defineTool(...)`), disable sentinels (`disableTool()`), and the
 * provider-managed web-search definitions.
 *
 * Authored `name` fields are rejected — tool identity is path-derived.
 */
export declare function normalizeToolDefinition(value: unknown, message: string): NormalizedToolEntry;
export {};
