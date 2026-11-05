import type { LanguageModel } from "ai";
import type { CompiledModuleMap } from "#compiler/module-map.js";
import type { RuntimeDynamicModelReference, RuntimeModelReference } from "#runtime/agent/bootstrap.js";
import { shouldMockAuthoredRuntimeModels } from "#runtime/agent/mock-model-adapter.js";
import { type PublicAgentDynamicModelDefinition, type PublicAgentDynamicModelResult } from "#shared/agent-definition.js";
import { type ModelMetadata } from "#internal/model-catalog.js";
export { shouldMockAuthoredRuntimeModels };
/** A deterministic authoring or selection error that retrying cannot repair. */
export declare class InvalidRuntimeModelSelectionError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
/** Loaded compiled-module scope used to resolve source-backed runtime models. */
export interface RuntimeModelResolutionScope {
    readonly moduleMap: CompiledModuleMap;
    readonly nodeId: string | undefined;
}
export interface ResolvedRuntimeModelSelection {
    /** Live provider instance; absent for string selections, which resolve through the reference so mock/bootstrap adapters keep precedence. */
    readonly model?: LanguageModel;
    readonly reference: RuntimeModelReference;
}
/**
 * Resolves one runtime model reference into the active language model.
 */
export declare function resolveRuntimeModelReference(reference: RuntimeModelReference, scope?: RuntimeModelResolutionScope): Promise<LanguageModel>;
export declare function loadDynamicRuntimeModelDefinition(input: {
    readonly dynamicModel: RuntimeDynamicModelReference;
    readonly scope: RuntimeModelResolutionScope;
}): Promise<PublicAgentDynamicModelDefinition>;
export declare function resolveRuntimeModelSelection(input: {
    readonly durability: "durable" | "live";
    /** The build's model metadata snapshot, read only when the selection omits its context window. */
    readonly modelMetadata: () => Promise<ModelMetadata>;
    readonly selection: PublicAgentDynamicModelResult;
}): Promise<ResolvedRuntimeModelSelection>;
