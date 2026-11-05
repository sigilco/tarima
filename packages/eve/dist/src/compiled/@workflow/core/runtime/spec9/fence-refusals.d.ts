/** Consecutive refusals of one run after which a refusal is logged at warn. */
export declare const REPEATED_FENCE_REFUSAL_WARN_THRESHOLD = 3;
/** Records one refusal of `runId`'s delivery; returns the run's streak. */
export declare function noteFenceRefusal(runId: string): number;
/** Ends `runId`'s streak: one of its deliveries finished without a refusal. */
export declare function clearFenceRefusals(runId: string): void;
/**
 * Whether a streak of `count` refusals is logged at warn: at the threshold,
 * then at every power of two above it, so a long loop logs O(log n) lines.
 */
export declare function warnsOnFenceRefusal(count: number): boolean;
/**
 * The delay of the redelivery a fence-refused orchestrator delivery asks for
 * (`{ timeoutSeconds }`) instead of acknowledging its message: long enough
 * for a second delivery of the message that is still running to commit or
 * fail, short enough that a refusal no other delivery explains costs about
 * a second.
 */
export declare const FENCE_REFUSAL_REDELIVERY_SECONDS = 1;
//# sourceMappingURL=fence-refusals.d.ts.map