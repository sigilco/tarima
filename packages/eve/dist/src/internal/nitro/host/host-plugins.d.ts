import type { CompiledExtensionMount } from "#compiler/manifest.js";
import type { ExternalsPolicy } from "#internal/nitro/host/externals-policy.js";
import type { WorkflowArtifacts } from "#internal/workflow-bundle/builder.js";
import type { NitroBuildPlugin } from "nitro/types";
export interface HostPluginsInput {
    readonly appRoot: string;
    /** Package root authored assets may not escape. */
    readonly authoredPackageRoot: string;
    readonly externals: ExternalsPolicy;
    readonly extensionMounts: readonly CompiledExtensionMount[];
    readonly extensionOverridePaths: ReadonlyMap<string, string>;
    readonly instrumentationEntryPlugin?: NitroBuildPlugin;
    readonly instrumentationSourcePaths?: readonly string[];
    /** Installed packages that generated modules left for the host; see `createAuthoredPlugins`. */
    readonly hostBundledPackageRoots?: readonly string[];
    /** Generated modules eve's runtime plugin imports only for their side effects. */
    readonly runtimeModules: readonly string[];
    readonly workflowArtifacts: WorkflowArtifacts;
}
/**
 * eve's host build plugins in the order they must run, all ahead of Nitro's
 * own. Step transforms and side-effect resolution come first so
 * extension-mount resolution never claims a workflow module.
 */
export declare function createHostPlugins(input: HostPluginsInput): NitroBuildPlugin[];
export interface ModulePathMatcher {
    /**
     * Matches a module specifier or id against the paths as the platform's
     * filesystem does: specifiers resolve against their importer, drive-less
     * absolute paths take the current drive on Windows, separators are compared
     * as `/`, and Windows compares case-insensitively. Returns the matched path
     * with `/` separators, or null.
     */
    readonly match: (specifier: string, importer?: string) => string | null;
    /**
     * A Rolldown id filter that admits every path `match` accepts, as given or
     * as `match` resolves it. A plugin that resolves a path to that form hands
     * later hooks the resolved id.
     */
    readonly idFilter: RegExp;
}
export declare function createModulePathMatcher(rootDir: string, paths: readonly string[], platform?: NodeJS.Platform): ModulePathMatcher;
