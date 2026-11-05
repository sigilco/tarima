import type { AuthoredWorkflowModules } from "#internal/workflow-bundle/builder-support.js";
import type { CompileAgentResult } from "#compiler/compile-agent.js";
import { type DevelopmentRuntimeArtifactsSnapshot } from "#internal/nitro/dev-runtime-artifacts.js";
export interface DevelopmentGeneration extends DevelopmentRuntimeArtifactsSnapshot {
    readonly authoredWorkflowModules?: AuthoredWorkflowModules;
    readonly fingerprint: string;
    /** Identity of the authored sources the workflow driver and step registrations are built from. */
    readonly workflowSourceFingerprint?: string;
}
export declare function stageDevelopmentGeneration(compileResult: CompileAgentResult): Promise<DevelopmentGeneration>;
/** Moves the dev runtime pointer so new sessions load `generation`. */
export declare function activateDevelopmentGeneration(input: {
    readonly appRoot: string;
    readonly generation: DevelopmentGeneration;
}): Promise<void>;
export declare function discardDevelopmentGeneration(generation: DevelopmentGeneration): Promise<void>;
/**
 * Creates a serial queue that prunes retired generations in the background.
 * Requests made while a prune runs coalesce into one more pass. When a pass
 * removes snapshots, `onRuntimePruned` reconciles the Workflow runs they
 * owned; a failed reconciliation, or a failed prune that may have removed
 * some, is retried after the next pass even if that pass removes nothing.
 * `close()` drops pending requests and resolves once the running pass ends.
 */
export declare function createDevelopmentGenerationPruner(input: {
    readonly appRoot: string;
    readonly onRuntimePruned?: () => Promise<void>;
}): DevelopmentGenerationPruner;
export interface DevelopmentGenerationPruner {
    /** Requests a pass; ignored once closed. */
    request(): void;
    close(): Promise<void>;
}
