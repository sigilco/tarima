import type { AuthoredWorkflowModules } from "#internal/workflow-bundle/builder-support.js";
import type { CompileAgentResult } from "#compiler/compile-agent.js";
import type { AgentWorkflowWorldDefinition } from "#shared/agent-definition.js";
export type BuiltInWorkflowWorldTarget = "local" | "vercel";
export interface GeneratedInstrumentationLayout {
    readonly kind: "directory";
    readonly slots: readonly string[];
}
/**
 * Paths to the generated compiled-artifacts files shared by Nitro and the
 * vendored workflow bundles for one application.
 */
export interface GeneratedCompiledArtifactsFiles {
    readonly authoredWorkflowModules?: AuthoredWorkflowModules;
    /**
     * Installs the bundled artifacts on import; eve's runtime plugin and the
     * workflow step entry both import it.
     */
    bootstrapPath: string;
    /** Installs the selected Workflow world on import, failing the import when it cannot. */
    workflowWorldPluginPath: string;
    /**
     * Optional Nitro plugin that imports prepared instrumentation runtime
     * entries when present.
     */
    instrumentationPluginPath?: string;
    /** Layout identity used by dev plugin selection and structural fingerprinting. */
    instrumentationLayout?: GeneratedInstrumentationLayout;
    /**
     * Absolute paths to prepared provider modules. Nitro uses these to preserve
     * each module's side effects during packaging.
     */
    instrumentationSourcePaths?: readonly string[];
    /**
     * Installed packages the generated modules import and leave for Nitro to bundle. They keep
     * the authored transforms, such as asset imports, that inlining them would have applied.
     */
    hostBundledPackageRoots?: readonly string[];
}
/** Writes the generated compiled-artifacts modules, which install themselves on import. */
export declare function writeCompiledArtifactsFiles(input: {
    compileResult: CompileAgentResult;
    defaultWorkflowWorld: BuiltInWorkflowWorldTarget;
    outDir: string;
}): Promise<GeneratedCompiledArtifactsFiles>;
export declare function writeDevelopmentCompiledArtifactsFiles(input: {
    readonly authoredWorkflowModules?: AuthoredWorkflowModules;
    readonly compileResult: CompileAgentResult;
    readonly outDir: string;
    readonly runtimeAppRoot: string;
}): Promise<GeneratedCompiledArtifactsFiles>;
export declare function createWorkflowWorldPluginSource(input: {
    compiledArtifactsBootstrapPath: string;
    configuredWorld: AgentWorkflowWorldDefinition | undefined;
    defaultWorld: BuiltInWorkflowWorldTarget;
}): string;
/**
 * Generates the dev worker's Workflow World wiring. Configs that resolve to
 * the vendored local World get the parent RPC client so run state survives
 * worker replacement; any other World is instantiated inside the worker
 * unchanged, because eve does not own its lifetime. The selection predicate
 * is shared with the parent's world creation — a worker wired for the RPC
 * client fails every World call unless the parent created a World to serve
 * it.
 */
export declare function createDevelopmentWorkflowWorldPluginSource(input: {
    compiledArtifactsBootstrapPath: string;
    configuredWorld: AgentWorkflowWorldDefinition | undefined;
}): string;
