/**
 * Fractions of the per-run event ceiling at which a run logs a warning
 * recommending the QuickJS VM with snapshotting, before it is failed with
 * `MAX_EVENTS_EXCEEDED`. Ascending.
 */
export declare const EVENT_LIMIT_WARNING_FRACTIONS: readonly [0.5, 0.8, 0.95];
/**
 * The highest milestone in {@link EVENT_LIMIT_WARNING_FRACTIONS} that
 * `eventCount` has reached for `limit`, or `undefined` when below the first
 * one (or the run has no effective ceiling).
 */
export declare function getEventLimitMilestone(eventCount: number, limit: number | undefined): number | undefined;
/**
 * Log a warning when a run's event log crosses a milestone of the per-run
 * event ceiling, recommending the QuickJS VM with snapshotting. Logged once
 * per (run, milestone) per process: every invocation replays the full log,
 * so without dedupe a run past a milestone would warn on every step.
 *
 * `isQuickJS` tailors the hint for QuickJS runs that still have a ceiling
 * (snapshotting disabled, or the run's `executionContext` doesn't record
 * the QuickJS snapshot policy).
 */
export declare function maybeWarnApproachingEventLimit(args: {
    runId: string;
    workflowName: string;
    eventCount: number;
    limit: number | undefined;
    isQuickJS: boolean;
}): void;
/** @internal Test-only. */
export declare function _resetEventLimitWarningsForTests(): void;
//# sourceMappingURL=event-limit-warning.d.ts.map