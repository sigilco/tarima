import type { ModuleSourceRef } from "#shared/source-ref.js";
import type { ProjectedAgentSources, ProjectedSource, ProjectedSubagentSource } from "#compiler/project-sources.js";
import { type AgentModuleBinding, type AgentModuleCandidate, type AgentSourceCandidate, type ComposedAgentModuleCandidates } from "#compiler/source-graph.js";
import type { NodeModuleEvaluationContext } from "#compiler/module-lifecycle.js";
export interface ComposedNodeSourceGraph {
    composed: ComposedAgentModuleCandidates;
    readonly orderedCandidates: readonly AgentSourceCandidate[];
    readonly projected: ProjectedAgentSources;
    readonly sourcesBySourceId: ReadonlyMap<string, ProjectedSource>;
    readonly subagentsBySourceId: ReadonlyMap<string, ProjectedSubagentSource>;
}
export interface SelectedNodeConfig {
    readonly binding: AgentModuleBinding;
    readonly candidate: AgentModuleCandidate;
    readonly definition: unknown;
    readonly source: ModuleSourceRef;
}
export interface PhaseOneNodeSourceState {
    readonly evaluation: NodeModuleEvaluationContext;
    readonly graph: ComposedNodeSourceGraph;
    readonly selectedConfig: SelectedNodeConfig;
}
export interface FinalizedNodeSourceState extends ComposedNodeSourceGraph {
    readonly bindings: Record<string, AgentModuleBinding>;
    readonly evaluation: NodeModuleEvaluationContext;
}
export declare function finalizeNodeSourceState(phaseOne: PhaseOneNodeSourceState, externalDependencies: readonly string[]): FinalizedNodeSourceState;
