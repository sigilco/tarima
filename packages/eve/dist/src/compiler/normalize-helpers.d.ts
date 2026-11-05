import type { ModuleSourceRef } from "#shared/source-ref.js";
import type { CompiledDefinition, CompiledDefinitionKind } from "#compiler/manifest.js";
import type { CompiledRuntimeModelCatalogLoader } from "#compiler/model-catalog.js";
import { type AgentModuleBinding, type AgentSourceRegistry, type AgentSourceOwner, type ProgrammaticModuleNamespace } from "#compiler/source-graph.js";
import type { CompiledBindingNamespaceLoader } from "#compiler/load-binding-namespace.js";
/**
 * Shared compile-time context threaded through every per-primitive
 * normalize step.
 *
 * Holds expensive lazily-loaded resources (currently the model catalog)
 * so each `compileAgentManifest` invocation pays the load cost once and
 * reuses the cache across all of its child compilations.
 */
export interface ManifestCompileContext {
    readonly modelCatalog: CompiledRuntimeModelCatalogLoader;
    readonly registries: readonly AgentSourceRegistry[];
}
export interface ModuleBackedDefinitionLoadOptions {
    readonly binding: AgentModuleBinding;
    readonly loadNamespace: CompiledBindingNamespaceLoader;
}
export interface SourceDefinitionCompileOptions {
    readonly binding?: AgentModuleBinding;
    readonly loadNamespace?: CompiledBindingNamespaceLoader;
    readonly owner: AgentSourceOwner;
}
export declare function requireModuleBackedDefinitionLoadOptions(options: SourceDefinitionCompileOptions, logicalPath: string): ModuleBackedDefinitionLoadOptions;
/**
 * Loads one authored module's value for a given source reference and
 * resolves any value-returning factory it may export.
 *
 * Used by every per-primitive compiler that targets a `module` source
 * (channels, sandboxes, tools, schedules, skills, prompt layers,
 * subagents). Wraps execution errors so the message identifies which
 * authored file failed.
 */
export declare function loadModuleBackedDefinition(input: {
    readonly binding: AgentModuleBinding;
    readonly dependencyNamespaces?: Readonly<Record<string, ProgrammaticModuleNamespace>>;
    readonly displayPath?: string;
    readonly kind: string;
    readonly loadNamespace: CompiledBindingNamespaceLoader;
    readonly source: ModuleSourceRef;
}): Promise<unknown>;
/** What `source` compiles to as a file eve asks at runtime, named `slug`. */
export declare function compiledDefinition(kind: CompiledDefinitionKind, source: ModuleSourceRef, slug: string, extra?: Pick<CompiledDefinition, "description" | "eventNames">): CompiledDefinition;
/** The definition `value` compiles to when it's a `defineDynamic()` export, or `undefined`. */
export declare function dynamicDefinition(kind: CompiledDefinitionKind, source: ModuleSourceRef, value: unknown, slug: string): CompiledDefinition | undefined;
