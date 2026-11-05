import { type Policy } from "#shared/restriction.js";
/** Whether a failed model call is tried again, and how long to wait first. */
export type RetryDecision = {
    readonly retry: false;
} | {
    readonly retry: true;
    readonly delayMs: number;
};
/** A failed attempt: which one it was, and what it threw. */
export interface RetryQuestion {
    readonly attempt: number;
    readonly error: unknown;
}
export type RetryPolicy = Policy<RetryQuestion, RetryDecision>;
/** A policy's answer when it has no objection to a retry, or when it stops one. */
export declare const ALLOW_RETRY: RetryDecision;
export declare const STOP_RETRY: RetryDecision;
/**
 * Retries `fn` while eve's retry policies and the caller's `policies` all allow it, waiting the
 * longest any asks for. Rethrows the last error once one stops it. `onRetry` hears each decision
 * to retry, before the wait.
 */
export declare function runModelCallWithRetries<T>(fn: () => Promise<T>, diag: {
    readonly sessionId: string;
    readonly turnId: string;
    readonly policies?: readonly RetryPolicy[];
    readonly onRetry?: (error: unknown) => Promise<void>;
}, signal?: AbortSignal): Promise<T>;
