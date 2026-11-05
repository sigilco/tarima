import type { Span } from '#compiled/@opentelemetry/api/index.js';
import type { RunInput, WorkflowRun } from '#compiled/@workflow/world/index.js';
/**
 * Whether a delivery may take the turbo fast path for this `runInput`. The
 * queued copy of a `start({ experimental_hook })` candidate may be refused by the
 * `run_started` it writes, so nothing of its may run before that write
 * returns: turbo, which backgrounds `run_started` and starts inline step
 * bodies first, is off for it on every engine.
 */
export declare function admitsTurboStart(runInput: RunInput | undefined): boolean;
/**
 * The queued copy of a `start({ experimental_hook })` candidate the World refused: another
 * run owns the token (`HookConflictError`), or the World will never admit the
 * request (`START_HOOK_ADMISSION_REJECTED`). Nothing of the candidate ran and
 * it never becomes a run, so the delivery acknowledges. Returns whether it
 * did; every other error, including the rest of `WorkflowWorldError`, is left
 * to the caller's ordinary handling. A refusal is recorded on the invocation
 * span, which otherwise ends OK and says nothing about it.
 */
export declare function ackRefusedStartHookCandidate(err: unknown, runInput: RunInput | undefined, runId: string, span?: Span): boolean;
/**
 * The queued copy of a `start({ experimental_hook })` candidate whose `run_started` the
 * World accepted, on the invocation span: the candidate owns the token,
 * whether this write admitted it or replayed the admission its `run_created`
 * won.
 *
 * Acceptance means the run the World returned echoes the requested token in
 * `run.startHook`, not merely that the write succeeded: a World that ignores
 * `startHook` (a backend that predates it) creates an ordinary run, and
 * running that run's code would make the start non-idempotent. That answer
 * throws a World contract error before any workflow code runs, which fails
 * the run.
 */
export declare function recordAcceptedStartHookCandidate(runInput: RunInput | undefined, run: Pick<WorkflowRun, 'runId'> & {
    startHook?: {
        token?: string;
    };
}, span?: Span, 
/**
 * `run_load` when the run was read rather than returned by this delivery's
 * own `run_started` (a redelivery after that write committed), so the span
 * does not count it as another admission.
 */
trigger?: StartHookTrigger): void;
type StartHookTrigger = 'run_started' | 'run_load';
export {};
//# sourceMappingURL=start-hook-delivery.d.ts.map