import { type ExtensionBuildConfig } from "#internal/nitro/host/build-extension.js";
/**
 * A mounted extension package whose authored source lives in the consuming
 * agent's workspace. Dev hosts retain it to scope extension HMR rebuilds.
 */
export interface WorkspaceExtension {
    readonly config: ExtensionBuildConfig;
    /** Canonical package root, with workspace links resolved. */
    readonly packageRoot: string;
    /** Non-source inputs that affect publisher output, such as tsconfig files. */
    readonly buildConfigPaths: readonly string[];
}
/**
 * Builds mounted source-backed workspace extensions before the consuming agent
 * compiles and returns the inputs needed to scope the next development rebuild.
 */
export declare function prepareDevelopmentWorkspaceExtensions(input: {
    readonly appRoot: string;
    readonly changedPaths?: readonly string[];
    readonly previousExtensions?: readonly WorkspaceExtension[];
}): Promise<readonly WorkspaceExtension[]>;
/**
 * Builds mounted source-backed workspace extensions before a production agent
 * build. Package manager lifecycle hooks such as `prepare` do not reliably run
 * (no-op installs and `--ignore-scripts` skip them), so production builds must
 * not assume an extension's gitignored distribution already exists. Extensions
 * whose distribution is newer than every build input are skipped. Builds hold
 * a per-package lock and recheck freshness under it, so parallel agent builds
 * that share an extension build it once.
 */
export declare function buildWorkspaceExtensions(appRoot: string): Promise<void>;
