import { type EveFrameworkHost } from "#shared/framework-eve-server.js";
export declare const NEXT_PHASE_PRODUCTION_BUILD = "phase-production-build";
export declare const NEXT_PHASE_PRODUCTION_SERVER = "phase-production-server";
export declare const EVE_NEXT_HOST: EveFrameworkHost;
/**
 * Start the built eve server for `appRoot` on `origin` once per process. Named
 * agents may share a root, each on its own port, so both identify the server.
 * `next start` calls this while loading config, because Next serves the
 * rewrites saved by `next build` and never calls `rewrites()` again.
 */
export declare function ensureEveProductionServer(input: {
    readonly appRoot: string;
    readonly origin: string;
}): Promise<void>;
export declare function resolveEveDestinationPrefix(input: {
    readonly appRoot: string;
    readonly devServerTimeoutMs?: number;
    readonly logLabel?: string;
    readonly productionDestinationPrefix: string;
    /** Workspace member selected when spawning the local eve dev server. */
    readonly workspaceAgentName?: string;
}): Promise<string>;
