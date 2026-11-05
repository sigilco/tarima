import { type AgentSourceManifest, type ConnectionSourceRef, type InstructionsSourceRef, type LocalSubagentSourceRef, type ScheduleSourceRef, type SkillSourceRef } from "#discover/manifest.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
import type { AgentModuleCandidate, AgentResourceCandidate, AgentSourceCandidate, AgentSourceLayer, AgentSourceOwner } from "#compiler/source-graph.js";
export type ProjectedModuleSource = {
    readonly candidate: AgentModuleCandidate;
    readonly kind: "connection";
    readonly source: ConnectionSourceRef;
} | {
    readonly candidate: AgentModuleCandidate;
    readonly kind: "channel" | "config" | "extension" | "hook" | "instructions" | "memory" | "sandbox" | "schedule" | "skill" | "tool";
    readonly source: ModuleSourceRef;
};
export type ProjectedResourceSource = {
    readonly candidate: AgentResourceCandidate;
    readonly kind: "instructions";
    readonly source: InstructionsSourceRef;
} | {
    readonly candidate: AgentResourceCandidate;
    readonly kind: "schedule";
    readonly source: ScheduleSourceRef;
} | {
    readonly candidate: AgentResourceCandidate;
    readonly kind: "skill";
    readonly source: SkillSourceRef;
};
export type ProjectedSource = ProjectedModuleSource | ProjectedResourceSource;
export interface ProjectedSubagentSource {
    readonly mountId?: string;
    readonly candidate: AgentResourceCandidate;
    readonly nodePath: string;
    readonly extensionScope?: {
        readonly namespace: string;
        readonly sourceRoot: string;
    };
    readonly owner: AgentSourceOwner;
    readonly source: LocalSubagentSourceRef;
}
export interface ProjectedAgentSources {
    readonly candidates: readonly AgentSourceCandidate[];
    readonly resources: readonly ProjectedResourceSource[];
    readonly subagents: readonly ProjectedSubagentSource[];
}
export declare function projectAgentSources(input: {
    readonly externalDependencies: readonly string[];
    readonly extensionScope?: {
        readonly namespace: string;
        readonly sourceRoot: string;
    };
    readonly layer?: AgentSourceLayer;
    readonly manifest: AgentSourceManifest;
    readonly nodeId: string;
    readonly nodePath: string;
    readonly owner?: AgentSourceOwner;
    readonly mountId?: string;
}): ProjectedAgentSources;
/**
 * Lists the application module files a compile may evaluate, across local
 * subagents, so they can be bundled as one shared graph. Extension mounts load
 * with their own scope and are left out.
 */
export declare function listApplicationModulePaths(manifest: AgentSourceManifest): string[];
export declare function projectSelectedSources(input: {
    readonly candidates: Iterable<AgentSourceCandidate>;
    readonly resources: readonly ProjectedResourceSource[];
}): readonly ProjectedSource[];
export declare function qualifyExtensionContributionLogicalPath(logicalPath: string, namespace: string): string;
