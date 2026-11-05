import type { PreparedDevelopmentApplicationHost } from "#internal/nitro/host/types.js";
/**
 * Hashes everything that shapes a development host build: the host spec minus
 * its locations, plus the inputs the host bundles or bakes in from disk.
 */
export declare function computeDevelopmentHostFingerprint(host: PreparedDevelopmentApplicationHost): Promise<string>;
