import { type ChildProcess } from "node:child_process";
/** Default time to wait for an eve server spawned by a framework integration. */
export declare const DEFAULT_EVE_SERVER_TIMEOUT_MS = 180000;
/**
 * Framework that owns the eve server process. `label` appears in errors;
 * `slug` keeps each framework's dev-server registry and lock separate.
 */
export interface EveFrameworkHost {
    readonly label: string;
    readonly slug: string;
}
export interface EveProcessHandle {
    readonly origin: string;
    readonly process?: ChildProcess;
}
/**
 * Validate a framework-supplied dev-server timeout. Returns `undefined` when
 * unset so callers fall back to {@link DEFAULT_EVE_SERVER_TIMEOUT_MS}.
 */
export declare function resolveDevServerTimeout(timeoutMs: number | undefined, host: EveFrameworkHost): number | undefined;
/**
 * Serve an existing `eve build` output from `.output/server/index.mjs` on
 * {@link input.origin}'s loopback port.
 */
export declare function startEveProductionServer(input: {
    readonly appRoot: string;
    readonly host: EveFrameworkHost;
    readonly origin: string;
    /** How to pick another port, completing "stop it or ..." when the port is taken. */
    readonly portRetryHint: string;
}): Promise<EveProcessHandle>;
/**
 * Resolve a shared eve dev server for `appRoot`, reusing a healthy registered
 * server when one exists and otherwise spawning `eve dev` behind a
 * cross-process lock so concurrent framework processes don't each boot eve.
 * `process` is set only when this call spawned the server.
 */
export declare function resolveSharedEveDevServer(input: {
    readonly appRoot: string;
    readonly host: EveFrameworkHost;
    readonly logLabel?: string;
    readonly timeoutMs?: number;
    /** Workspace member selected when spawning the local eve dev server. */
    readonly workspaceAgentName?: string;
}): Promise<EveProcessHandle>;
