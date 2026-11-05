/** Error display shared by the TUI runner and renderer. */
import type { ErrorInfo } from "#protocol/session-events/envelope.js";
/** A user interrupt is a clean exit, never a failure. */
export declare class InterruptedError extends Error {
    constructor();
}
export declare function interruptedError(): InterruptedError;
export declare function isInterruptedError(error: unknown): boolean;
/** Two failures with one key are the same failure, as a session repeating its turn's. */
export declare function failureKey(error: ErrorInfo): string;
export declare function formatFailureMessage({ code, message }: ErrorInfo): string;
/** v27 exposes a support id, not the private diagnostic dump. */
export declare function formatFailureDetail(error: ErrorInfo): string | undefined;
export declare function localFailureHint(error: ErrorInfo): string | undefined;
