import { EveError } from "#shared/eve-error.js";
/**
 * A session could not accept a command. No delivery was accepted.
 *
 * `code` is the HTTP channel's `409` code: `session_not_ready` (with `retryable: true`) while an
 * accepted session is still starting, otherwise `session_not_active`.
 */
export declare class SessionNotActiveError extends EveError {
    static readonly errorName = "SessionNotActiveError";
    readonly code: "session_not_active" | "session_not_ready";
    readonly retryable: boolean;
    constructor(options?: {
        readonly retryable?: boolean;
    });
}
/** Whether an answer targets a session that cannot run or no longer exists. */
export declare function isUnanswerableResponseError(error: unknown): boolean;
