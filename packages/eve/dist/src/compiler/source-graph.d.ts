export { validateProgrammaticLogicalPath } from "#compiler/source-graph-paths.js";
export type ProgrammaticModuleNamespace = Readonly<Record<string, unknown>>;
/** Shares zero-argument definition-factory results within one module-map load. */
export declare function memoizeModuleNamespaceFactories(namespace: ProgrammaticModuleNamespace): ProgrammaticModuleNamespace;
export interface ProgrammaticAgentModule {
    readonly exportName?: string;
    readonly loadNamespace: () => Promise<ProgrammaticModuleNamespace>;
    readonly logicalPath: string;
    readonly semanticRevision?: string;
}
export interface ProgrammaticAgentSource {
    readonly id: string;
    readonly modules: readonly ProgrammaticAgentModule[];
    readonly revision: string;
}
export interface AgentSourceRegistration {
    readonly applyTo: "root" | "all-local-nodes";
    readonly source: ProgrammaticAgentSource;
}
interface AgentSourceRegistryOptions {
    /** Programmatic extension declarations loaded by compiled virtual mounts. */
    readonly extensionDeclarations?: readonly ProgrammaticAgentSource[];
}
export interface AgentSourceRegistry {
    readonly registrations: readonly AgentSourceRegistration[];
    readonly sources: ReadonlyMap<string, ProgrammaticAgentSource>;
}
export type AgentSourceOwner = {
    readonly kind: "application";
} | {
    readonly feature: string;
    readonly kind: "framework";
} | {
    readonly kind: "extension";
    readonly mountId: string;
    readonly namespace: string;
    readonly packageName: string;
};
export declare function extensionMountId(nodePath: string, namespace: string): string;
export type AgentSourceLayer = "framework-default" | "extension-package" | "extension-override" | "application";
export type AgentSourceForm = "derived" | "direct";
export type AgentModuleBacking = {
    readonly externalDependencies: readonly string[];
    readonly mountId?: string;
    readonly extensionScope?: {
        readonly namespace: string;
        readonly sourceRoot: string;
    };
    readonly kind: "filesystem";
    readonly sourcePath: string;
} | {
    readonly mountId?: string;
    readonly kind: "programmatic";
    readonly moduleId: string;
    readonly registryId: string;
    readonly revision: string;
    readonly semanticRevision?: string;
};
export type AgentSourceBacking = AgentModuleBacking | {
    readonly kind: "resource";
    readonly sourcePath: string;
};
export interface AgentModuleCandidate {
    readonly backing: AgentModuleBacking;
    readonly exportName?: string;
    readonly form: AgentSourceForm;
    readonly layer: AgentSourceLayer;
    readonly logicalPath: string;
    readonly nodeId: string;
    readonly owner: AgentSourceOwner;
    readonly sourceId: string;
}
export interface AgentModuleBinding {
    readonly backing: AgentModuleBacking;
    readonly logicalPath: string;
    readonly owner: AgentSourceOwner;
}
export interface CompiledModuleBinding extends AgentModuleBinding {
    /** Compiler-owned namespace usage for this selected binding. */
    readonly usage: {
        /** The compiler evaluated this namespace while normalizing the node. */
        readonly compile: boolean;
        /** The namespace is an entry in the runtime module map. */
        readonly runtimeEntry: boolean;
    };
}
export interface AgentSourceDescriptor {
    readonly backing: AgentSourceBacking;
    readonly form: AgentSourceForm;
    readonly layer: AgentSourceLayer;
    readonly logicalPath: string;
    readonly owner: AgentSourceOwner;
    readonly sourceId: string;
}
export interface AgentResourceCandidate {
    readonly backing: Extract<AgentSourceBacking, {
        readonly kind: "resource";
    }>;
    readonly form: AgentSourceForm;
    readonly layer: AgentSourceLayer;
    readonly logicalPath: string;
    readonly nodeId: string;
    readonly owner: AgentSourceOwner;
    readonly sourceId: string;
}
export type AgentSourceCandidate = AgentModuleCandidate | AgentResourceCandidate;
export declare function isAgentModuleCandidate(candidate: AgentSourceCandidate): candidate is AgentModuleCandidate;
export type AgentSourceCompositionEntry = {
    readonly kind: "shadowed";
    readonly source: AgentSourceDescriptor;
    readonly winnerSourceId: string;
} | {
    readonly kind: "disabled";
    readonly source: AgentSourceDescriptor;
};
export interface AgentSourceComposition {
    readonly entries: readonly AgentSourceCompositionEntry[];
}
export interface ComposedAgentModuleCandidates {
    readonly composition: AgentSourceComposition;
    readonly selected: ReadonlyMap<string, AgentSourceCandidate>;
}
export declare function defineProgrammaticAgentSource(input: ProgrammaticAgentSource): ProgrammaticAgentSource;
export declare function defineProgrammaticExtensionMountDeclaration(input: ProgrammaticAgentSource): ProgrammaticAgentSource;
export declare function createAgentSourceRegistry(registrations: readonly AgentSourceRegistration[], options?: AgentSourceRegistryOptions): AgentSourceRegistry;
export declare function createProgrammaticModuleCandidates(input: {
    readonly layer: AgentSourceLayer;
    readonly nodeId: string;
    readonly owner: AgentSourceOwner;
    readonly registration: AgentSourceRegistration;
}): readonly AgentModuleCandidate[];
export declare function composeAgentModuleCandidates(candidates: readonly AgentSourceCandidate[]): ComposedAgentModuleCandidates;
export declare function disableComposedCandidate(input: {
    readonly allowUnmatched?: boolean;
    readonly candidate: AgentSourceCandidate;
    readonly composed: ComposedAgentModuleCandidates;
}): ComposedAgentModuleCandidates;
export declare function createAgentModuleBinding(candidate: AgentModuleCandidate): AgentModuleBinding;
export declare function loadProgrammaticModuleNamespace(input: {
    readonly backing: Extract<AgentModuleBacking, {
        readonly kind: "programmatic";
    }>;
    readonly registries: readonly AgentSourceRegistry[];
}): Promise<ProgrammaticModuleNamespace>;
/**
 * Canonical composition slot for one logical path. Module extensions, folder
 * forms, and skill packages collapse onto the same authored primitive identity.
 */
export declare function canonicalSourceSlot(logicalPath: string): string;
export declare function describeAgentSourceCandidate(candidate: AgentSourceCandidate): AgentSourceDescriptor;
