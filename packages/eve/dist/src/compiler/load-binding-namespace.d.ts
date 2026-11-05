import { type AgentModuleBinding, type AgentSourceRegistry, type ProgrammaticModuleNamespace } from "#compiler/source-graph.js";
import { type AuthoredModuleLoadOptions } from "#internal/authored-module-loader.js";
import type { AuthoredModuleGraph } from "#internal/authored-module-graph.js";
export type CompiledBindingNamespaceLoader = (sourceId: string) => Promise<ProgrammaticModuleNamespace>;
export interface ExtensionCompileMount {
    readonly mountId: string;
    readonly entry?: NonNullable<AuthoredModuleLoadOptions["extension"]>["entry"];
}
/** Loads one node's selected bindings with dependency ordering and per-phase caching. */
export declare function createCompiledBindingNamespaceLoader(input: {
    /**
     * Selected app root; application modules stamp Workflow ids relative to it. Required so
     * no caller silently falls back to the package root, which differs in workspace members.
     */
    readonly appRoot: string | undefined;
    readonly bindings?: Readonly<Record<string, AgentModuleBinding>>;
    readonly graph?: AuthoredModuleGraph;
    readonly mounts?: ReadonlyMap<string, ExtensionCompileMount>;
    readonly evaluationId?: string;
    readonly mountSourceId?: (binding: AgentModuleBinding) => string | undefined;
    readonly onLoad?: (sourceId: string) => void;
    readonly registries: readonly AgentSourceRegistry[];
    readonly resolveBinding?: (sourceId: string) => AgentModuleBinding | undefined;
}): CompiledBindingNamespaceLoader;
/** Derives the owning mount for state handles in an extension module. */
export declare function resolveExtensionBindingMountId(binding: AgentModuleBinding): string | undefined;
