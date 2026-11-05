import type { AgentModuleBinding, AgentSourceRegistry, CompiledModuleBinding } from "#compiler/source-graph.js";
import type { CompiledAgentDefinition } from "#compiler/manifest.js";
import { createCompiledBindingNamespaceLoader, type CompiledBindingNamespaceLoader } from "#compiler/load-binding-namespace.js";
/** Owns namespace loading and lifecycle decisions for one node compilation. */
export declare class NodeModuleEvaluationContext {
    #private;
    readonly loadNamespace: CompiledBindingNamespaceLoader;
    constructor(registries: readonly AgentSourceRegistry[], mountSourceId?: (binding: AgentModuleBinding) => string | undefined, mounts?: Parameters<typeof createCompiledBindingNamespaceLoader>[0]["mounts"], evaluationId?: string, appRoot?: string, graph?: Parameters<typeof createCompiledBindingNamespaceLoader>[0]["graph"]);
    setBindings(bindings: Readonly<Record<string, AgentModuleBinding>>): void;
    requireRuntimeEntry(sourceId: string): void;
    finalizeBindings(): Record<string, CompiledModuleBinding>;
}
/** Marks authored config namespaces whose values must be resolved by the runtime. */
export declare function markConfigRuntimeEntries(config: CompiledAgentDefinition, evaluation: NodeModuleEvaluationContext): void;
