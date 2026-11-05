/** Whether a workflow hook or run can no longer accept task traffic. */
export declare function isTaskWorkflowTargetGone(error: unknown): boolean;
/** Awaits traffic to a workflow hook or run, which a target already gone makes moot. */
export declare function ignoreGoneTarget(pending: Promise<unknown>): Promise<void>;
