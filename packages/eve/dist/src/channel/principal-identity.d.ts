import type { SessionAuthContext } from "#channel/types.js";
/**
 * The fields that identify a principal, in a fixed order, for hashing into
 * invocation owner keys and tool session ids. Attributes describe a principal;
 * they do not identify it. Adding a field changes every derived hash.
 */
export declare function principalIdentity(auth: SessionAuthContext): readonly string[];
/** Whether `auth` is the shared principal `none()` gives every unauthenticated caller. */
export declare function isAnonymousPrincipal(auth: SessionAuthContext): boolean;
/** The principal `none()` gives every unauthenticated caller. */
export declare const ANONYMOUS_SESSION_AUTH_CONTEXT: SessionAuthContext;
