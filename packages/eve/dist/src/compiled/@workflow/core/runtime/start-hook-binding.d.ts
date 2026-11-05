import { type Event, type RunInput, type WorkflowRun } from '#compiled/@workflow/world/index.js';
/**
 * The start Hook of a run created with `start(workflow, args, { experimental_hook })`.
 *
 * The admission that creates the run also creates this Hook, under an id
 * derived from the run's id, so it exists (and can be resumed) before the
 * workflow body runs, and no `hook_created` is ever written for it. The
 * workflow's `createHook({ token })` with this token binds to `hookId`
 * instead of minting a new one.
 */
export interface RunStartHook {
    readonly token: string;
    readonly hookId: string;
    /**
     * `start({ experimental_hook: { experimental_minRetention } })`'s deadline, when set.
     * Only decides whether a disposal still has to be written when the run
     * ends (a retained token is not released by the run's end), exactly as a
     * `hook_created`'s `tokenRetentionUntil` does for an ordinary Hook.
     */
    readonly tokenRetentionUntil?: Date;
}
/**
 * The run's start Hook, or `undefined` for a run started without one.
 *
 * Read, in order, from the log's `run_created.eventData.startHook` (the first
 * event of the log, immutable), the queue message's `runInput.startHook` (the
 * log may not hold `run_created` yet), and `workflowRun.startHook`. Every
 * replay must bind the same token, so sources that are present must agree;
 * one that disagrees is a World bug and throws rather than binding a
 * different id on some replays.
 *
 * Pure and synchronous: no I/O, and for a run without a start Hook it reads
 * three fields and returns.
 */
export declare function resolveRunStartHook({ events, workflowRun, runInput, }: {
    events: readonly Event[] | undefined;
    workflowRun: Pick<WorkflowRun, 'runId'> & {
        startHook?: unknown;
    };
    runInput?: Pick<RunInput, 'startHook'> | undefined;
}): RunStartHook | undefined;
/**
 * Mint a hook correlation id, redrawing on the one id this run must never
 * mint: its start Hook's. The draw is a pure function of the run's ULID
 * sequence, so the redraw (if any) is the same on every replay. Run ids
 * tagged by their World never collide with a minted id at all, so the loop
 * almost never runs twice.
 */
export declare function mintHookCorrelationId(generateUlid: () => string, startHook: Pick<RunStartHook, 'hookId'> | undefined): string;
//# sourceMappingURL=start-hook-binding.d.ts.map