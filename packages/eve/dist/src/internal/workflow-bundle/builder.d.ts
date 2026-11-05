import { type WorkflowBundleBuilderConfig, type WorkflowBundleBuilderOptions, type WorkflowBundleCreateWorkflowsBundleOptions, type WorkflowBundleCreateWorkflowsBundleResult, type WorkflowBundleDiscoveredEntries } from "#internal/workflow-bundle/builder-support.js";
import { type WorkflowManifest } from "#internal/workflow-bundle/workflow-builders.js";
/** The workflow directory one build wrote, as the host build consumes it. */
export interface WorkflowArtifacts {
    /** Absolute paths of the modules the step entry imports; the host bundles them in step mode. */
    readonly stepTargets: readonly string[];
    readonly stepsPath: string;
    readonly workflowsPath: string;
}
export declare class WorkflowBundleBuilder {
    #private;
    protected readonly config: WorkflowBundleBuilderConfig;
    constructor(options: WorkflowBundleBuilderOptions);
    build(): Promise<WorkflowArtifacts>;
    protected get transformProjectRoot(): string;
    /** The authored package; a workspace member without its own package.json shares the enclosing one. */
    protected get authoredPackageRoot(): string;
    protected getInputFiles(): Promise<string[]>;
    protected discoverEntries(inputs: readonly string[]): Promise<WorkflowBundleDiscoveredEntries>;
    protected createWorkflowsBundle({ appWorkflowFiles, frameworkSerdeFiles, frameworkWorkflowFiles, outfile, stepRegistrationsPath, }: WorkflowBundleCreateWorkflowsBundleOptions): Promise<WorkflowBundleCreateWorkflowsBundleResult>;
    protected createManifest({ manifest, manifestDir, }: {
        manifest: WorkflowManifest;
        manifestDir: string;
        workflowBundlePath: string;
    }): Promise<string | undefined>;
}
