export { EVE_INTERNAL_BUILD_OUTPUT_DIRECTORY_ENV, EVE_INTERNAL_HOST_BUILD_OUTPUT_DIRECTORY_ENV, } from "#internal/application/build-output-environment.js";
export interface ApplicationInfo {
    appRoot: string;
    outputDir: string;
    workflowId: string;
    workflowBuildDir: string;
    workflowSourceDir: string;
}
/**
 * Resolves an application root from the current working directory.
 */
export declare function resolveApplicationRoot(cwd?: string): string;
/**
 * Resolves the package-owned Workflow DevKit bundle directory for a target app.
 *
 * This directory is intentionally placed under the package root rather than the
 * application root so package-owned workflow caches are shared across generated
 * app roots without relying on app-local installed dependencies.
 *
 * Each application root receives a unique hash-keyed subdirectory so parallel
 * builds targeting different app roots never collide. The key is derived from
 * `appRoot` alone, so every code path that resolves a cache directory
 * converges on the same location.
 */
export declare function resolveWorkflowBuildDirectory(appRoot: string): string;
/**
 * Resolves the cache directory used for durable local sandbox snapshots.
 */
export declare function resolveSandboxCacheDirectory(appRoot: string): string;
/**
 * Resolves the production Nitro output directory for an app.
 */
export declare function resolveOutputDirectory(appRoot: string): string;
/**
 * Returns structured app information for diagnostics and CLI output.
 */
export declare function getApplicationInfo(appRoot: string): ApplicationInfo;
