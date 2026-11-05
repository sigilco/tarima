import type { SessionPrewarmPayload } from "#execution/session-prewarm.js";
import type { SessionFailurePayload } from "#execution/session-inbox/inbox.js";
import type { DeliverHookPayload, SessionCommand, SessionTimeoutHookPayload } from "#channel/types.js";
import { type SessionInboxAddress } from "#execution/session-inbox/address.js";
export interface ResumedSessionInboxHook {
    readonly ownerRunId: string;
    readonly inbox?: string;
    /** Lazy identity resolution; delivery never needs to decrypt hook metadata. */
    readonly sessionId: Promise<string>;
}
/**
 * Resumes the current owner with the current command shape. Owners on
 * handoff version 3 never leave an address unowned. An older owner releases
 * its hooks before its successor claims them and leaves a marker for that
 * interval, so delivery retries instead of
 * reporting the session gone and letting a channel start a replacement.
 * The retry window bounds this request, not the handoff: a marker that
 * outlives it throws {@link SessionHandoffPendingError}.
 */
export declare function resumeSessionInbox(address: string | SessionInboxAddress, command: DeliverHookPayload | SessionCommand | SessionTimeoutHookPayload | SessionFailurePayload | SessionPrewarmPayload): Promise<ResumedSessionInboxHook>;
/**
 * The address's owner is still handing off after the request's retry window.
 * Nothing was delivered. The address is not unowned, so callers must not start
 * a session there; the request can be retried.
 */
export declare class SessionHandoffPendingError extends Error {
    constructor(token: string);
}
export declare class AcceptedSessionIdentityError extends Error {
    constructor(cause: unknown);
}
export declare function requireSessionId(metadata: unknown): string;
export declare function resolveSessionInbox(token: string): Promise<{
    sessionId: string;
}>;
/** Logical token behind an address: the address itself, or the session's stable command token. */
export declare function logicalSessionToken(address: string | SessionInboxAddress): string;
