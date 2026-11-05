import type { NodeModuleEvaluationContext } from "#compiler/module-lifecycle.js";
import type { ComposedNodeSourceGraph, SelectedNodeConfig } from "#compiler/node-source-state.js";
import type { AgentSourceManifest, LocalSubagentSourceRef } from "#discover/manifest.js";
import type { CompiledAgentDefinition, CompiledExtensionMount, CompiledRemoteAgentNode, CompiledSubagentNode } from "#compiler/manifest.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
import type { ExtensionCompileMount } from "#compiler/load-binding-namespace.js";
import type { FinalizedNodeSourceState } from "#compiler/node-source-state.js";
import type { CompilerDiagnostic } from "#compiler/diagnostics.js";
import { normalizeSubagentConfig } from "#compiler/normalize-subagent.js";
import { type AgentModuleCandidate, type AgentSourceOwner, type AgentSourceRegistry, type ComposedAgentModuleCandidates, type CompiledModuleBinding } from "#compiler/source-graph.js";
export declare function loadSelectedNodeConfig(state: ComposedNodeSourceGraph, evaluation: NodeModuleEvaluationContext): Promise<SelectedNodeConfig>;
export declare function collectSelectedSourceIds(composed: ComposedAgentModuleCandidates): Set<string>;
export declare function assertRootOnlyConfig(config: CompiledAgentDefinition, isRoot: boolean, agentId: string): void;
export declare function assertApplicationOverlayCanApplyToAllNodes(logicalPaths: readonly string[]): void;
export declare function assertUniqueRegistryIds(registries: readonly AgentSourceRegistry[]): void;
export declare function assertNonExtensionSpecialTool(candidate: AgentModuleCandidate, label: string): void;
export declare function withExtensionNamespace<T extends {
    readonly extensionNamespace?: string;
}>(definition: T, owner: AgentSourceOwner): T;
export declare function withDiagnosticsSummary(subagents: readonly CompiledSubagentNode[], diagnosticsSummary: import("#discover/diagnostics.js").DiscoverDiagnosticsSummary): CompiledSubagentNode[];
export declare function expectSubagentDescription(config: CompiledAgentDefinition, source: LocalSubagentSourceRef): string;
export declare function createCompiledRemoteAgent(input: {
    readonly binding: CompiledModuleBinding;
    readonly definition: Extract<ReturnType<typeof normalizeSubagentConfig>, {
        readonly kind: "remote";
    }>;
    readonly nodeId: string;
    readonly owner: AgentSourceOwner;
    readonly parentNodeId: string;
    readonly source: LocalSubagentSourceRef;
    readonly sourceRef: ModuleSourceRef;
}): CompiledRemoteAgentNode;
export declare function compileChannelRoutes(state: FinalizedNodeSourceState, channels: readonly import("#compiler/manifest.js").CompiledChannelDefinition[], diagnostics: CompilerDiagnostic[], nodeId: string): import("#compiler/manifest.js").CompiledChannelRoutePlan;
export declare function resolveExtensionMountSource(manifest: AgentSourceManifest, mount: AgentSourceManifest["resolvedExtensions"][number], nodePath: string): {
    mountId: string;
    logicalPath: string;
    mountSourceId: string;
    mountSourcePath: string;
} | undefined;
export declare function createExtensionCompileMounts(manifest: AgentSourceManifest, nodePath: string): {
    mounts: Map<string, ExtensionCompileMount>;
    sourceIds: Map<string, string>;
};
export declare function compileExtensionMounts(manifest: AgentSourceManifest, composed: ComposedAgentModuleCandidates, nodePath: string): CompiledExtensionMount[];
export declare function mergeExternalDependencies(...lists: ReadonlyArray<readonly string[] | undefined>): string[];
