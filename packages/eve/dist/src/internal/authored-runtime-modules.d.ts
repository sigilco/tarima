import type { AuthoredWorkflowModules } from "#internal/workflow-bundle/builder-support.js";
import type { CompiledAgentManifest } from "#compiler/manifest.js";
interface PreparedAuthoredRuntimeInstrumentation {
    readonly kind: "directory";
    readonly moduleCodeBySlot: Readonly<Record<string, string>>;
}
export interface PreparedAuthoredRuntimeModules {
    readonly authoredWorkflowModules: AuthoredWorkflowModules;
    readonly instrumentation: PreparedAuthoredRuntimeInstrumentation;
    readonly moduleMapCode: string;
    /** Installed packages the generated modules import and the host bundles. */
    readonly hostBundledPackageRoots: readonly string[];
    readonly sourceModules: readonly string[];
    /** Identity of authored sources shared by the workflow driver and step registrations. */
    readonly workflowSourceFingerprint: string | undefined;
}
/** Builds the authored runtime graph before a development or production host packages it. */
export declare function prepareAuthoredRuntimeModules(input: {
    readonly appRoot: string;
    readonly manifest: CompiledAgentManifest;
    readonly moduleMapPath: string;
    /** Whether the host bundles the prepared modules again, as hosted builds do. */
    readonly hostBundled?: boolean;
}): Promise<PreparedAuthoredRuntimeModules>;
export {};
