import type { DevelopmentBuilds } from "#internal/nitro/host/dev-build-host.js";
import type { DevelopmentExtensionSelection } from "#compiler/development-extensions.js";
import type { DevHostSwitch } from "#internal/nitro/host/dev-host-supervisor.js";
import type { PreparedDevelopmentApplicationHost } from "#internal/nitro/host/types.js";
type DevelopmentRebuildKind = "structural" | "unchanged" | "runtime";
/**
 * Raised when generation activation fails after the replacement worker has
 * already been swapped in. The server keeps serving on the new worker with
 * the previous generation; the next rebuild retries activation.
 */
export declare class PostCommitDevelopmentRebuildError extends Error {
    constructor(cause: unknown);
}
/**
 * Raised when an authored reload changes which process owns the Workflow
 * World. That ownership is fixed when the development server starts, so the
 * existing server must keep serving until the user restarts it.
 */
export declare class DevelopmentWorkflowWorldChangeRequiresRestartError extends Error {
    constructor();
}
export interface DevelopmentRebuildResult {
    readonly host: PreparedDevelopmentApplicationHost;
    readonly kind: DevelopmentRebuildKind;
}
export interface DevelopmentAuthoredRebuildCoordinator {
    rebuild(input: {
        readonly changedPaths: readonly string[];
    }): Promise<DevelopmentRebuildResult>;
    /** Stops generation pruning, waiting for a running pass. */
    close(): Promise<void>;
}
export declare function createDevelopmentAuthoredRebuildCoordinator(input: {
    readonly builds: DevelopmentBuilds;
    readonly developmentExtensions?: DevelopmentExtensionSelection;
    readonly devServer: DevHostSwitch;
    readonly initialHost: PreparedDevelopmentApplicationHost;
    readonly onRuntimePruned?: () => Promise<void>;
}): Promise<DevelopmentAuthoredRebuildCoordinator>;
export {};
