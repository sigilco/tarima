import type { VercelCreateOptions } from "#execution/sandbox/bindings/vercel-sdk-types.js";
/**
 * How long a tool session's saved filesystem outlives its last use. It is
 * also the shortest `snapshotExpiration` the Sandbox API accepts.
 */
export declare const VERCEL_TOOL_SESSION_SNAPSHOT_EXPIRATION_MS: number;
export declare function withToolSessionRetention(options: VercelCreateOptions): VercelCreateOptions;
