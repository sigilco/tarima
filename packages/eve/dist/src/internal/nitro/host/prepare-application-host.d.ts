import type { DevelopmentExtensionSelection } from "#compiler/development-extensions.js";
import type { ApplicationBuildWorkspace } from "#internal/application/build-workspace.js";
import { type DevelopmentHostWorkspace } from "#internal/nitro/host/dev-host-workspace.js";
import { type WorkspaceExtension } from "#internal/nitro/host/workspace-extensions.js";
import type { PreparedApplicationHost, PreparedDevelopmentApplicationHost } from "#internal/nitro/host/types.js";
/**
 * Compiles one authored app and stages an isolated runtime generation and host
 * candidate without changing the active development server.
 */
export declare function prepareDevelopmentApplicationHost(appRoot: string, options?: {
    readonly changedPaths?: readonly string[];
    readonly developmentExtensions?: DevelopmentExtensionSelection;
    readonly previousExtensions?: readonly WorkspaceExtension[];
    /** An empty workspace created by the caller; one is created otherwise. */
    readonly workspace?: DevelopmentHostWorkspace;
}): Promise<PreparedDevelopmentApplicationHost>;
/**
 * Builds mounted source-backed workspace extensions, then compiles one
 * authored app into an invocation-owned build workspace and stages the
 * package-owned artifacts the production Nitro build needs.
 * Compiler artifacts are written inside the workspace but their recorded
 * locations point at the published output (`<finalDir>/.eve`), where
 * publication later installs them.
 */
export declare function prepareProductionApplicationHost(workspace: ApplicationBuildWorkspace): Promise<PreparedApplicationHost>;
export declare function refreshProductionCompiledArtifacts(host: PreparedApplicationHost, outDir: string): Promise<void>;
