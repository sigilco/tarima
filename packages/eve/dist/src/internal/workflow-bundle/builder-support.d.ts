import { type WorkflowManifest } from "#internal/workflow-bundle/workflow-builders.js";
export declare const WORKFLOW_VIRTUAL_ENTRY_ID = "\0eve-workflow-entry";
export interface AuthoredWorkflowModules {
    readonly directiveModules: readonly string[];
    readonly workflowModules: readonly string[];
}
export interface WorkflowBundleBuilderOptions {
    readonly authoredWorkflowModules?: AuthoredWorkflowModules;
    agentName: string;
    appRoot: string;
    compiledArtifactsBootstrapPath: string;
    outDir: string;
    rootDir: string;
    /** Test-harness-only: also scans `src/internal/testing/`. */
    includeTestFixtures?: boolean;
}
export declare const WORKFLOW_SOURCE_EXTENSIONS: readonly string[];
export declare function isWorkflowSourceFile(fileName: string): boolean;
export interface WorkflowBundleBuilderConfig {
    readonly dirs: readonly string[];
    readonly projectRoot: string;
    readonly workingDir: string;
}
export interface WorkflowBundleDiscoveredEntries {
    readonly discoveredSerdeFiles: string[];
    readonly discoveredSteps: string[];
    readonly discoveredWorkflows: string[];
}
export interface WorkflowBundleCreateWorkflowsBundleOptions {
    readonly appWorkflowFiles: readonly string[];
    readonly frameworkSerdeFiles: readonly string[];
    readonly frameworkWorkflowFiles: readonly string[];
    readonly outfile: string;
    readonly stepRegistrationsPath: string;
}
export interface WorkflowBundleCreateWorkflowsBundleResult {
    readonly manifest: WorkflowManifest;
}
interface WorkflowRolldownPlugin {
    readonly name: string;
    readonly resolveId?: (source: string, importer?: string) => unknown;
    readonly load?: (id: string) => unknown;
    readonly transform?: (code: string, id: string) => unknown;
}
export declare function collectWorkflowInputFiles(root: string): Promise<string[]>;
export declare function createWorkflowImport(filePath: string, workingDir: string): string;
export declare function createWorkflowVirtualEntryPlugin(source: string): WorkflowRolldownPlugin;
/**
 * `eve/workflow` resolves to the body-side shim. An `eve/workflow/api` import still live
 * after step bodies were stubbed means a body calls the runtime API; fail the
 * build here rather than the driver later.
 */
export declare function createWorkflowDriverAliasPlugin(workingDir: string): WorkflowRolldownPlugin;
export declare function createEvePackageImportsPlugin(workingDir: string, options?: {
    workflowCondition?: boolean;
}): WorkflowRolldownPlugin;
export declare function createWorkflowTransformPlugin(input: {
    manifest: WorkflowManifest;
    mode?: "step" | "workflow";
    projectRoot: string;
    sideEffectFiles?: readonly string[];
    workingDir: string;
}): WorkflowRolldownPlugin;
export declare function createWorkflowNodeBuiltinGuardPlugin(): WorkflowRolldownPlugin;
export declare function bundleFinalWorkflowOutput(input: {
    code: string;
    outfile: string;
    queueNamespace: string;
    stepRegistrationsPath?: string;
}): Promise<void>;
/**
 * Chunks share state only through globals (the workflow registry, the serde
 * class registry, `Symbol.for` keys), so each runs in its own IIFE and their
 * top-level declarations never collide.
 */
export declare function composeWorkflowDriverCode(chunks: readonly string[]): string;
export declare function createWorkflowEntrypointSource(input: {
    readonly code: string;
    readonly queueNamespace: string;
    readonly stepRegistrationsImport?: string;
}): string;
export declare function convertStepsManifest(steps: WorkflowManifest["steps"]): Record<string, unknown>;
export declare function convertWorkflowsManifest(workflows: WorkflowManifest["workflows"]): Record<string, unknown>;
export declare function convertClassesManifest(classes: WorkflowManifest["classes"]): Record<string, unknown>;
export declare function mergeWorkflowManifest(target: WorkflowManifest, source: WorkflowManifest): void;
export {};
