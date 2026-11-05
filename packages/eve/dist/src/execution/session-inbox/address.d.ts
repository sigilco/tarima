/** Serialized-context key advertising a session's stable inbox. */
export declare const SESSION_INBOX_CONTEXT_KEY = "eve.sessionInbox";
/** Hook metadata key that keeps public identity separate from hook ownership. */
export declare const SESSION_INBOX_SESSION_ID_METADATA_KEY = "sessionId";
/** Stable inbox coordinates. The owner and deployment are intentionally absent. */
export interface SessionInboxAddress {
    readonly sessionId: string;
    readonly inbox?: string;
}
export declare function isSessionInboxAddress(value: unknown): value is SessionInboxAddress;
/** Returns whether a token belongs to eve's framework-reserved session namespace. */
export declare function isReservedSessionCommandToken(token: string): boolean;
/** Logical stable command inbox token for a session. */
export declare function sessionCommandHookToken(sessionId: string): string;
/**
 * Physical hook token for a logical session address. Applied exactly where a
 * hook is created or resumed, so current-generation hooks stay disjoint from
 * hooks owned by pre-cutover drivers that used the logical token directly.
 */
export declare function sessionInboxHookToken(token: string): string;
/** Whether a physical hook token addresses a current-generation session inbox. */
export declare function isSessionInboxHookToken(token: string): boolean;
/** Logical address behind a physical session inbox hook token; `undefined` for any other hook. */
export declare function logicalSessionInboxToken(token: string): string | undefined;
/**
 * Marker an owner older than handoff version 3 leaves while it releases its
 * hooks, so ingress can tell "handoff in progress" from "no session".
 */
export declare function sessionHandoffMarkerToken(token: string): string;
