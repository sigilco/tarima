import type { DevelopmentHostBuild, DevelopmentPrepareInput } from "#internal/nitro/host/dev-build-host.js";
import type { PreparedDevelopmentApplicationHost } from "#internal/nitro/host/types.js";
/** Compiles the agent and stages a candidate generation in its own host workspace. */
export declare function prepareDevelopmentBuild(input: DevelopmentPrepareInput): Promise<PreparedDevelopmentApplicationHost>;
/** Builds the Nitro host for a prepared candidate and returns its worker entry. */
export declare function buildDevelopmentHost(host: PreparedDevelopmentApplicationHost): Promise<DevelopmentHostBuild>;
