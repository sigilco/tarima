/**
 * Prefix of a parent's child-run completion token. The token is the parent's
 * run id behind this prefix, which is globally unique, so a child computes it
 * from the parent id it was stamped with.
 */
export declare const CHILD_RUN_COMPLETION_TOKEN_PREFIX = "wkf_child_run_completion:";
/**
 * The `executionContext` key `start()` stamps on a child with the run id of
 * the parent that may await it through the completion hook.
 */
export declare const CHILD_RUN_COMPLETION_CONTEXT_KEY = "completionParentRunId";
/**
 * Version of the completion-hook protocol a deployment implements: whether
 * it resumes {@link childRunCompletionToken} for runs stamped with
 * {@link CHILD_RUN_COMPLETION_CONTEXT_KEY}. Advertised on the health check so
 * a cross-deployment `start()` only stamps a run whose executing deployment
 * honors it.
 */
export declare const CHILD_RUN_COMPLETION_VERSION = 1;
/** The payload a finished child resumes its parent's completion hook with. */
export interface ChildRunCompletionPayload {
    runId: string;
    status: 'completed' | 'failed' | 'cancelled';
}
/**
 * Delay of the n-th safety-net re-check of pending children: 5 minutes after
 * the parent starts waiting, then doubling, capped at 6 hours. A check costs
 * one sleep and one step, so a child that runs for a day costs its parent
 * about a dozen of each, and a lost notification is noticed within one
 * interval.
 */
export declare function safetyCheckDelayMs(index: number): number;
export declare function childRunCompletionToken(parentRunId: string): string;
/**
 * When called inside the workflow VM of the run that started `childRunId`,
 * waits for the child through the parent's completion hook and returns its
 * return value. Returns `undefined` everywhere else (host code, steps, a
 * workflow that was handed someone else's `Run`), where the caller polls.
 *
 * `readValue` is the child's return-value step (it polls until the child is
 * terminal, so it is only called once the child is known to be done), and
 * `readFinished` the step that reports which of a batch of runs finished.
 */
export declare function awaitChildRunCompletion<T>(childRunId: string, parentRunId: string | undefined, readValue: () => Promise<T>, readFinished: (runIds: string[]) => Promise<string[]>): Promise<T> | undefined;
//# sourceMappingURL=child-run-completion.d.ts.map