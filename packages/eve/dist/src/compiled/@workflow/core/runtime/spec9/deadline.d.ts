/** Default margin before the function's deadline in which no inline step starts. */
export declare const DEFAULT_INLINE_STEP_DEADLINE_MARGIN_MS = 60000;
/**
 * How long before the function's max duration the orchestrator stops
 * starting inline steps (`WORKFLOW_INLINE_STEP_DEADLINE_MARGIN_MS`, default
 * {@link DEFAULT_INLINE_STEP_DEADLINE_MARGIN_MS}). A step created inside the
 * margin is handed to the queue instead, so the platform does not cut a body
 * off at the deadline; a body killed that way is retried and counts as a
 * platform re-execution.
 */
export declare function getInlineStepDeadlineMarginMs(env?: Record<string, string | undefined>): number;
/** Whether an inline step may still start at `nowMs`. */
export declare function mayStartInlineStep(params: {
    nowMs: number;
    deadlineMs: number | undefined;
    marginMs: number;
}): boolean;
//# sourceMappingURL=deadline.d.ts.map