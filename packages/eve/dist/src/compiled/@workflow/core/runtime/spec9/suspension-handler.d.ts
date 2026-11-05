import type { Span } from '#compiled/@opentelemetry/api/index.js';
import { type WorkflowRun, type World } from '#compiled/@workflow/world/index.js';
import type { WorkflowSuspension } from '../../global.js';
import type { PendingQueueDrain } from '../../workflow.js';
import type { SuspensionSerializationBlocker } from '../delivery.js';
import { type EventCreator, type LoadedEventLog } from '../helpers.js';
import { ReplayRecoveryReporter } from '../replay-recovery-reporter.js';
export interface SuspensionHandlerParams {
    suspension: WorkflowSuspension;
    world: World;
    run: WorkflowRun;
    span?: Span;
    requestId?: string;
    /**
     * The workflow is completing or failing. Its terminal event cleans up hooks,
     * so only dispose hooks needed to release a token early or for a later
     * registration.
     */
    terminalDrain?: boolean;
    /**
     * The runtime's loaded event log. Every event creation this suspension makes
     * names the position it was derived from, so a backend that has recorded
     * events the replay did not see can report them back on the write, or, if
     * it would rather refuse than report, reject it with a 412. A rejection is
     * not retried here: the event's correlation id was minted by *this* replay's
     * seeded sequence, so re-committing it against a corrected log would persist
     * an event no correct replay produces. The caller restarts the replay
     * instead.
     *
     * Extended in place by what those writes report back — the events on slots
     * they skipped over, and (on the hook create) the inline delta since its
     * cursor.
     */
    eventLog?: LoadedEventLog;
    /** One-shot telemetry reporter, activated only after replay has recovered. */
    replayRecoveryReporter?: ReplayRecoveryReporter;
    /**
     * The invocation's record of hooks whose force-claim victim wake it has
     * already published or attempted, whether as the forced creation's own wake
     * or as a replay's republish (see `republishOwedForceClaimVictimWakes`). The
     * caller passes one set for the whole invocation so a run that suspends more
     * than once per invocation sends each hook's wake once, not once per
     * suspension. Omitted, every suspension republishes on its own.
     */
    forceClaimVictimWakes?: Set<string>;
    /**
     * Writes this suspension's events in place of `world.events.create`. The
     * single-orchestrator runtime passes its in-band writer, so every write is
     * marked in-band and fenced.
     */
    writeEvent?: EventCreator;
}
/**
 * What a suspension's hook and attribute writes mean for the caller: the hook
 * awaiters they settled, the time spent committing hooks, and serialization
 * diagnostics. The live caller writes a suspension's steps and waits itself;
 * the end-of-run drain writes them here and reads nothing back.
 */
export interface SuspensionHandlerResult {
    /**
     * Correlation ids of the hooks this suspension committed a `hook_created`
     * for while a `hook.getConflict()` awaiter was waiting on it — the events
     * that resolve those awaiters on the next pass.
     *
     * Reported by id, not just counted, so a caller that continues in this
     * process can tell a continuation that got somewhere from one that is
     * repeating: a workflow may create one awaited hook after another, and each
     * new id is a pass that made progress, while the same id coming back means
     * the pass ran over a log that still did not hold its event and continuing
     * again cannot change that.
     */
    awaitedHookCorrelationIds: string[];
    /**
     * Correlation ids of the hooks whose create committed a `hook_conflict`:
     * the token was already claimed, so this run's hook was never created. The
     * caller answers it by advancing the workflow over the committed event
     * before it dispatches or runs the steps this suspension scheduled.
     *
     * By id for the same reason as {@link awaitedHookCorrelationIds}, and
     * against the same hazard: a conflict is resolved by the `hook_conflict`
     * this suspension committed, and until the workflow observes it the hook
     * stays in the invocations queue and the next pass writes the create again.
     * A fresh id is progress; the same id coming back is a pass that ran over a
     * log which still did not hold the event, so continuing again cannot change
     * that.
     */
    hookConflictCorrelationIds: string[];
    /**
     * Wall-clock ms this suspension spent blocked on nothing but committing its
     * `hook_created` events (0 when it created none): the stretch the hook
     * writes outlasted every other write, since until then the suspension was
     * waiting on those too. The caller accumulates this across iterations and
     * subtracts it from the TTFS latency measurement, so time spent durably
     * creating the user's hooks doesn't count as runtime overhead.
     */
    hookCreationMs: number;
    /** Exact number of workflow-code executions observed during serialization. */
    serializationBlockerCount: number;
    /** Bounded sample used only for retention diagnostics. */
    serializationBlockers: SuspensionSerializationBlocker[];
}
/**
 * Writes a suspension's pending hook, attribute, step and wait events. The
 * live spec 9 orchestrator passes only hooks and attributes (it writes steps
 * and waits itself, with their execution mode); the end-of-run drain passes
 * everything, and steps written here are never queued or run.
 *
 * Every write is issued concurrently: hook creations and disposals (in code
 * order per token, then abort deliveries), step and wait events (batched where
 * the World supports it), and attribute events.
 *
 * Hooks are not written ahead of the steps created alongside them. A step
 * started in the same suspension as a hook can therefore run before that hook
 * is registered; a workflow that needs the hook registered first (say, a step
 * that hands the token to something that resumes it at once) awaits
 * `hook.getConflict()` before calling the step.
 */
export declare function handleSuspension({ suspension, world, run, span, requestId, eventLog, replayRecoveryReporter, forceClaimVictimWakes, writeEvent, terminalDrain, }: SuspensionHandlerParams): Promise<SuspensionHandlerResult>;
/**
 * The end-of-run drain of the spec 9 orchestrator (see `PendingQueueDrain`):
 * the queued items are written like any suspension's, through the
 * orchestrator's in-band writer.
 */
export declare function pendingQueueDrain(world: World, writeEvent: EventCreator): PendingQueueDrain;
//# sourceMappingURL=suspension-handler.d.ts.map