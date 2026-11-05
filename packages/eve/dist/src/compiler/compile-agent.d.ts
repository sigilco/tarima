import type { ResolvedDiscoveryProject } from "#discover/project.js";
import { type ProjectSource } from "#discover/project-source.js";
import { type CompileMetadata, type CompilerArtifactLocations, type CompilerArtifactPaths } from "#compiler/artifacts.js";
import type { CompiledAgentManifest } from "#compiler/manifest.js";
import { type CompilerDiagnostic } from "#compiler/diagnostics.js";
import type { DevelopmentExtensionSelection } from "#compiler/development-extensions.js";
/**
 * Input for compiling the current authored agent into framework-owned
 * discovery artifacts.
 */
interface CompileAgentInput {
    /** Development-only source extensions applied before source composition. */
    developmentExtensions?: DevelopmentExtensionSelection;
    /**
     * Optional {@link ProjectSource} used for discovery reads. Defaults to a
     * disk-backed source so production callers keep their current behaviour.
     */
    source?: ProjectSource;
    startPath?: string;
}
/**
 * Result of compiling the current authored agent into framework-owned
 * artifacts.
 */
export interface CompileAgentResult {
    diagnostics: CompilerDiagnostic[];
    manifest: CompiledAgentManifest;
    metadata: CompileMetadata;
    paths: CompilerArtifactPaths;
    project: ResolvedDiscoveryProject;
}
/**
 * Error raised when discovery artifacts were written but discovery still
 * contained errors.
 */
export declare class CompileAgentError extends Error {
    readonly result: CompileAgentResult;
    private constructor();
    static fromDurableArtifacts(result: CompileAgentResult): CompileAgentError;
    static fromTransientArtifacts(result: CompileAgentResult): CompileAgentError;
}
/**
 * Runs discovery, writes compiler-owned artifacts, and throws when discovery
 * produced errors.
 */
export declare function compileAgent(input?: CompileAgentInput): Promise<CompileAgentResult>;
/**
 * Compiles an agent into a caller-owned workspace. Artifacts are written to
 * `writeRoot`, while metadata and module maps record paths under the stable
 * `publishedRoot` where the caller will expose them.
 */
export declare function compileAgentInWorkspace(input: {
    readonly artifactLocations: CompilerArtifactLocations;
    readonly developmentExtensions?: DevelopmentExtensionSelection;
    readonly startPath: string;
}): Promise<CompileAgentResult>;
export {};
