import type { WorkflowRunWithoutData, World } from '#compiled/@workflow/world/index.js';
import { type ChildRunCompletionPayload } from './child-run-completion.js';
/**
 * Whether runs started from a workflow are stamped so their parent can await
 * them through the child-run completion hook. On by default; an explicit
 * `WORKFLOW_CHILD_RUN_COMPLETION_HOOK=0` (or `false`) stops new runs from
 * being stamped, so their parents fall back to polling `returnValue` inside
 * a step. Runs already stamped keep notifying their parents either way.
 *
 * @internal
 */
export declare function isChildRunCompletionHookEnabled(): boolean;
/**
 * The parent whose completion hook a run resumes when it finishes, or
 * `undefined` for a run that was not started from a workflow.
 */
export declare function completionParentRunId(executionContext: Record<string, unknown> | undefined): string | undefined;
type NotifiableRun = Pick<WorkflowRunWithoutData, 'runId' | 'executionContext'>;
/**
 * Resumes the completion hook of the parent that started `run`, if any, with
 * `{ runId, status }`; all of a parent's children share that one hook. Call
 * it after the run's terminal event is written: the parent reads the run
 * after registering its hook, so a resume that finds no hook is only safe
 * once that read would see the run as finished.
 *
 * Accepts the run itself when the caller already has it loaded, or its id
 * (read here, metadata only) on paths that do not.
 *
 * Never throws. A hook that does not exist is the common case (the parent
 * has not awaited the child yet, never will, or already finished) and is not
 * an error. Transient World failures are retried with backoff; anything that
 * still fails is logged.
 */
export declare function notifyParentOfRunCompletion(world: World, run: NotifiableRun | string, status: ChildRunCompletionPayload['status']): Promise<void>;
export {};
//# sourceMappingURL=child-run-completion-notify.d.ts.map