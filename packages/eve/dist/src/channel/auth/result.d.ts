import type { SessionAuthContext } from "#channel/types.js";
/** Persist and forward identity only, never a channel's request-local permission extensions. */
export declare function sessionAuthFromResult(result: SessionAuthContext): SessionAuthContext;
