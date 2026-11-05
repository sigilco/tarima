import type { ToolSet } from "ai";
import type { StepCatalog } from "#execution/catalog/step-catalog.js";
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { ModelProfile } from "#harness/model-profile.js";
import type { Step } from "#harness/step/context.js";
/**
 * Assembles the tools one model call offers: the catalog's listed entries with provider tools in
 * place, and `eve__reply` when the turn asks for a structured result.
 */
export declare function prepareModelTools(step: Step, input: {
    readonly catalog: StepCatalog;
    readonly disabledProviderTools?: ReadonlySet<string>;
    readonly profile: ModelProfile;
}): Promise<ToolSet>;
/** The entries that can end the turn, with their `endsTurn` option, when `endsTurn` applies. */
export declare function endsTurnTools(catalog: StepCatalog, applies: boolean): EndsTurnTools;
/** The names of the entries eve provides, which tracing marks as framework tools. */
export declare function frameworkToolNames(catalog: StepCatalog): ReadonlySet<string>;
export type EndsTurnTools = ReadonlyMap<string, NonNullable<HarnessToolDefinition["endsTurn"]>>;
