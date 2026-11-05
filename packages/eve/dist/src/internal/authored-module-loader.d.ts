import type { Plugin } from "rolldown";
import type { CompiledAgentManifest } from "#compiler/manifest.js";
import type { AuthoredModuleGraph } from "#internal/authored-module-graph.js";
import { type GenerationHostBundle } from "#internal/authored-package-boundary.js";
import type { AuthoredWorkflowModules } from "#internal/workflow-bundle/builder-support.js";
import { type WorkflowManifest } from "#internal/workflow-bundle/workflow-builders.js";
export declare const AUTHORED_BUNDLED_MODULE_EXTENSION: RegExp;
export declare const AUTHORED_MODULE_BUNDLE_DIRECTORY_PATH: string;
export interface ExtensionMountEntry {
    readonly mountSourcePath: string;
    readonly packageName: string;
    readonly sourceRoot: string;
    readonly specifier: string;
}
export interface AuthoredModuleLoadOptions {
    /**
     * Selected app root that owns authored Workflow ids. A workspace member's app root sits
     * below the shared package root, which still owns dependency resolution.
     */
    readonly appRoot?: string;
    readonly externalDependencies?: readonly string[];
    readonly extension?: {
        readonly mountId: string;
        /** Only filesystem mounts need a synthetic entry to bind their configuration. */
        readonly entry?: ExtensionMountEntry;
        /**
         * Filesystem mounts enclosing `mountId`, outermost first. A mount declared inside another
         * extension may read that extension's configuration, so those mounts bind first.
         */
        readonly ancestors?: readonly (ExtensionMountEntry & {
            readonly mountId: string;
        })[];
        readonly evaluationId?: string;
    };
    /** Shares one evaluated module graph across the loads of one compilation. */
    readonly graph?: AuthoredModuleGraph;
}
/**
 * Loads one authored module namespace from disk during compile-time
 * discovery. Concurrent loads of the same `modulePath` share a single
 * Promise so the underlying bundle/import pipeline runs once.
 */
export declare function loadAuthoredModuleNamespace(modulePath: string, options?: AuthoredModuleLoadOptions): Promise<Record<string, unknown>>;
/**
 * Bundles one authored entry for immediate dev/eval loading. Package dependencies
 * remain external while relative authored source is inlined.
 */
export declare function bundleAuthoredModuleCode(modulePath: string, options?: AuthoredModuleLoadOptions): Promise<string>;
/**
 * Bundles one authored entry for an immutable development generation. Ordinary
 * package dependencies are inlined so the emitted code stays executable after
 * the original workspace changes; framework runtime imports and explicitly
 * configured external dependencies keep their normal runtime resolution.
 */
export declare function bundleAuthoredModuleForGeneration(modulePath: string, options?: AuthoredModuleLoadOptions & {
    readonly hostBundle?: GenerationHostBundle;
}): Promise<string>;
/** One path-preserving entry in an extension distribution graph. */
export interface ExtensionDistributionGraphEntry {
    /** Output path relative to `dist/`, without the `.mjs` extension. */
    readonly name: string;
    /** Absolute authored module path. */
    readonly path: string;
}
/**
 * Transforms an extension's authored modules as one code-split graph while
 * preserving an entry for every agent-shaped source module. Package imports
 * remain external for the consuming app and source maps are omitted.
 */
export declare function bundleExtensionDistributionGraph(input: {
    readonly entries: readonly ExtensionDistributionGraphEntry[];
    readonly packageRoot: string;
    readonly runtimeDependencies: readonly string[];
}): Promise<{
    readonly files: ReadonlyMap<string, string>;
    readonly imports: readonly string[];
}>;
/**
 * Bundles every runtime-authored module in one immutable generation graph.
 * Shared dependencies are parsed and emitted once instead of once per authored
 * entry.
 */
export interface AuthoredModuleMapBundle {
    readonly authoredWorkflowModules: AuthoredWorkflowModules;
    readonly code: string;
    /** Application modules in the graph, including shared workspace modules outside the app root. */
    readonly sourceModules: readonly string[];
    /** Fingerprint of the sources that also feed the driver and step registry; a change rebuilds the host. */
    readonly workflowSourceFingerprint: string | undefined;
}
export declare function bundleAuthoredModuleMapForGeneration(input: {
    readonly appRoot: string;
    readonly manifest: CompiledAgentManifest;
    readonly moduleMapPath: string;
    readonly resolveExternalPaths?: boolean;
    readonly hostBundle?: GenerationHostBundle;
}): Promise<AuthoredModuleMapBundle>;
/** Reuses the build's own resolution so the fingerprint is exact without a second resolver. */
declare class AuthoredWorkflowSourceRecorder {
    #private;
    constructor(appRoot: string);
    record(id: string, source: string, manifest: WorkflowManifest): void;
    sourceModules(): readonly string[];
    graphPlugin(): Plugin;
    modules(): AuthoredWorkflowModules;
    fingerprint(): string | undefined;
}
export declare function createAuthoredWorkflowDirectivePlugin(input: {
    readonly appRoot: string;
    readonly recorder?: AuthoredWorkflowSourceRecorder;
}): Plugin;
export {};
