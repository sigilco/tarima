export declare function getErrorName(v: unknown): string;
export declare function getErrorMessage(v: unknown): string;
export declare function getErrorStack(v: unknown): string;
/**
 * Summarize the `cause` chain hanging off a thrown value, one link per line,
 * outermost first. The value itself is skipped: whatever logs this already
 * states it, in the message or in the stack header.
 *
 * `util.inspect` renders `[cause]` when Node prints an error, but the
 * structured logs read `name` / `message` / `stack` and drop everything else
 * — exactly the wrong half for errors that arrive pre-wrapped.
 * `TypeError: fetch failed` is the canonical one: undici's wrapper says
 * nothing on its own and its stack is all `node:internal/` frames, so the DNS,
 * socket or TLS failure that actually happened is only readable one or two
 * `cause` hops down. Same for the world layer's own wrapping, where the
 * request that failed is on the wrapper and the reason it failed is on the
 * cause.
 *
 * `AggregateError` also gets its `errors` summarized, because a
 * happy-eyeballs connect reports every attempt there and leaves the
 * `AggregateError` itself blank.
 *
 * Returns `''` when there is no cause, so callers can drop the field.
 */
export declare function formatErrorCauseChain(value: unknown): string;
export declare function isAbortError(value: unknown): value is {
    name: 'AbortError';
    message: string;
    stack?: string;
};
export declare function promoteAbortErrorToFatal(value: unknown): unknown;
export interface NormalizedUnknownError {
    name: string;
    message: string;
    stack: string;
}
/**
 * Normalizes unknown thrown values into a stable error shape.
 * This handles Promise/thenable throw values so logs/events never end up
 * with unhelpful "[object Promise]" messages.
 */
export declare function normalizeUnknownError(value: unknown): Promise<NormalizedUnknownError>;
//# sourceMappingURL=types.d.ts.map