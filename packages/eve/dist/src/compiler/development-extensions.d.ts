import { type CompilerDiagnostic } from "#compiler/diagnostics.js";
import { type AgentModuleCandidate, type AgentSourceRegistry } from "#compiler/source-graph.js";
import type { AgentSourceManifest } from "#discover/manifest.js";
declare const DEVELOPMENT_EXTENSION_IDS: readonly ["self-modification"];
export type DevelopmentExtensionId = (typeof DEVELOPMENT_EXTENSION_IDS)[number];
export interface DevelopmentExtensionSelection {
    readonly enabled: readonly DevelopmentExtensionId[];
}
/** Returns the registry used only by generated local-development module maps. */
export declare function getDevelopmentExtensionSourceRegistry(): AgentSourceRegistry;
export declare function defaultDevelopmentExtensions(): DevelopmentExtensionSelection;
export declare function noDevelopmentExtensions(): DevelopmentExtensionSelection;
/** Discovers selected bundled extensions and creates their root mount candidates. */
export declare function prepareDevelopmentExtensions(input: {
    readonly diagnostics: CompilerDiagnostic[];
    readonly manifest: AgentSourceManifest;
    readonly nodeId: string;
    readonly selection: DevelopmentExtensionSelection;
}): Promise<{
    readonly candidates: readonly AgentModuleCandidate[];
    readonly manifest: AgentSourceManifest;
}>;
export {};
