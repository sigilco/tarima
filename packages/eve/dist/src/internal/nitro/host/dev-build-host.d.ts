import type { DevelopmentExtensionSelection } from "#compiler/development-extensions.js";
import { type DevelopmentHostWorkspace } from "#internal/nitro/host/dev-host-workspace.js";
import type { PreparedDevelopmentApplicationHost } from "#internal/nitro/host/types.js";
import type { WorkspaceExtension } from "#internal/nitro/host/workspace-extensions.js";
export interface DevelopmentPrepareInput {
    readonly appRoot: string;
    readonly changedPaths?: readonly string[];
    readonly developmentExtensions?: DevelopmentExtensionSelection;
    readonly previousExtensions?: readonly WorkspaceExtension[];
    /** Created by the dev server, so it can remove the workspace if the build process dies. */
    readonly workspace?: DevelopmentHostWorkspace;
}
/** Worker entry and data for a built Nitro host. */
export interface DevelopmentHostBuild {
    readonly entry: string;
    readonly workerData: Readonly<Record<string, unknown>>;
}
interface DevelopmentBuildOperations {
    readonly buildHost: {
        readonly input: PreparedDevelopmentApplicationHost;
        readonly value: DevelopmentHostBuild;
    };
    readonly prepare: {
        readonly input: DevelopmentPrepareInput;
        readonly value: PreparedDevelopmentApplicationHost;
    };
}
export type DevelopmentBuildOperation = keyof DevelopmentBuildOperations;
export declare const DEVELOPMENT_BUILD_MESSAGE_KIND = "eve:development-build";
export interface DevelopmentBuildRequest {
    /** The dev server's environment, including `.env` changes staged for this rebuild. */
    readonly environment: Readonly<Record<string, string | undefined>>;
    readonly id: number;
    readonly input: unknown;
    readonly kind: typeof DEVELOPMENT_BUILD_MESSAGE_KIND;
    readonly operation: DevelopmentBuildOperation;
}
export type DevelopmentBuildOutcome = {
    readonly ok: true;
    readonly value: unknown;
} | {
    readonly ok: false;
    readonly error: SerializedError;
};
export type DevelopmentBuildResponse = {
    /** The build's Docker probe result, if it probed. */
    readonly dockerAvailability: boolean | undefined;
    readonly id: number;
    readonly kind: typeof DEVELOPMENT_BUILD_MESSAGE_KIND;
} & DevelopmentBuildOutcome;
export interface DevelopmentBuildSession {
    prepare(input: DevelopmentPrepareInput): Promise<PreparedDevelopmentApplicationHost>;
    buildHost(host: PreparedDevelopmentApplicationHost): Promise<DevelopmentHostBuild>;
    /** Ends the session. Its build process exits, releasing everything it loaded. */
    close(): void;
}
/** The build processes owned by one dev server. */
export interface DevelopmentBuilds {
    /**
     * Starts a build session for one rebuild. Every step that evaluates
     * authored code or runs Rolldown happens in the session's child process,
     * which exits when the session closes. Node never unloads an imported
     * module and Rolldown's native memory belongs to the whole process, so
     * exiting is the only way to release both.
     */
    begin(): DevelopmentBuildSession;
    /** Stops every build process, including the spare. Later sessions fail. */
    close(): void;
}
interface SerializedError {
    cause?: SerializedError;
    message: string;
    name: string;
    stack?: string;
}
/**
 * Forks a build process before the dev server loads its own modules, so the
 * two startups overlap. The first {@link createDevelopmentBuilds} adopts it.
 */
export declare function prewarmDevelopmentBuildProcess(): void;
export declare function createDevelopmentBuilds(): DevelopmentBuilds;
export declare function serializeError(error: unknown, depth?: number): SerializedError;
export {};
