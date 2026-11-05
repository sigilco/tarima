import type { SessionAuthContext } from "#channel/types.js";
/**
 * Prefix of every keyed tool session id. Sandbox bindings read it to name and
 * find tool-session sandboxes, since a tool session keeps no record of its own.
 */
export declare const TOOL_SESSION_ID_PREFIX = "tool_session_";
export declare function isToolSessionId(sessionId: string): boolean;
/** Why a tool session key was refused, or `undefined` when it is usable. */
export declare function validateToolSessionKey(key: string): string | undefined;
/**
 * Derives a keyed tool session id from the caller and the key. Nothing is
 * stored: every call recomputes the id from its authenticated principal, so
 * another caller sending the same key reaches a different session. The
 * caller must not be anonymous; `invokeTool` denies that before calling.
 * A forwarded caller's id also covers the verified forwarder, so one user
 * reached through two forwarders gets two sessions.
 */
export declare function deriveToolSessionId(input: {
    readonly current: SessionAuthContext;
    readonly forwardedBy?: SessionAuthContext;
    readonly key: string;
}): string;
