import type { SessionAuthContext } from "#channel/types.js";
import type { ConnectionCallbackContext } from "#shared/connection-types.js";
/**
 * Runs one connection tool call so its `headers` and provided arguments see who approved it.
 * One authorization context serves the whole call, so its inline providers share one scope.
 */
export declare function withConnectionApproval<T>(connectionName: string, responder: SessionAuthContext | undefined, fn: () => T): T;
/** The session context a connection's `headers` and provided-argument callbacks receive. */
export declare function buildConnectionCallbackContext(): ConnectionCallbackContext;
