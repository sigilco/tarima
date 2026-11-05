/**
 * The QuickJS deliveries' dispatch of pending VM operations, shared by both
 * orchestrators (`spec8/quickjs-entrypoint.ts`, `spec9/quickjs-entrypoint.ts`).
 * The options that differ between them say which orchestrator uses which.
 */
/**
 * QuickJS WebAssembly (WASM) VM integration with the Workflow DevKit.
 *
 * This module provides the entry point for running workflows in the
 * QuickJS VM engine instead of the `node:vm` engine. Both engines
 * implement the same event-replay execution model, where every invocation:
 *
 * 1. Loads the full event log for the run
 * 2. Runs the workflow function from the top in a fresh QuickJS VM,
 *    replaying the event log to resolve awaited primitives
 * 3. On suspension: creates events + queues steps for new pending ops
 * 4. On completion: creates run_completed
 * 5. On failure: creates run_failed
 */
import { type CreateEventRequest, type EventBatchResult, type WorkflowRun } from '#compiled/@workflow/world/index.js';
import { type RunPayloadKeys } from './../serialization/encryption.js';
import type { EventCreator } from './quickjs-delivery-shared.js';
import type { PendingOperation, PendingStep } from './quickjs-runtime.js';
import type { getWorld } from './world.js';
/**
 * Dispatch durable side effects for a set of pending VM operations:
 * step_created (+ optional queueing), hook_created / hook_received (aborts),
 * attr_set, hook_disposed, and wait_created events.
 *
 * Steps are created but never queued here: queueing (or inline execution)
 * is the caller's decision. Used both for suspension
 * processing (the inline loop) and for the terminal drain (flushing
 * leftover side effects when the workflow completed or failed, mirroring
 * the node:vm engine's drainPendingQueueItems).
 */
export declare function dispatchPendingOps(params: {
    world: Awaited<ReturnType<typeof getWorld>>;
    runId: string;
    /**
     * The seam every event write in this pass goes through. The inline loop
     * passes a create that names the log position this invocation holds
     * (`eventCount`) and queues what the World hands back for the live VM; see
     * {@link QuickJSLogView}. The terminal drain passes a plain create, since
     * the run is ending and nothing reads its log afterwards.
     */
    createEvent: EventCreator;
    /**
     * The cursor this invocation's log was read to, when the caller wants a lone
     * `hook_created` to ask for the inline delta against it (`sinceCursor`).
     * The hook's awaiters are settled by the event that write commits and by
     * nothing else (a `hook_created`, or the `hook_conflict` a claimed token
     * commits instead), so the delta hands the VM that event, plus anything
     * another writer landed meanwhile, without a listing. Same gate as the node
     * engine's `hookDeltaCursor`: asked for only when exactly one hook needs
     * creating, since two creates diffing against one cursor would produce two
     * deltas of which only the first could be taken. Omitted by the terminal
     * drain.
     */
    deltaCursor?: string;
    workflowRun: WorkflowRun;
    encryptionKey: RunPayloadKeys | undefined;
    pendingOperations: PendingOperation[];
    /**
     * Step cids whose `step_created` must NOT be written here: the inline
     * loop claims these atomically via a lazy `step_started` (carrying the
     * input), so a concurrent claimant loses with EntityConflictError
     * instead of both invocations bare-starting the same step.
     */
    skipStepCreation?: Set<string>;
    /**
     * Correlation ids of the waits and attribute writes whose event this
     * invocation already committed. Neither has a row a World could refuse a
     * second create with, and the VM may not have been fed the committed event
     * yet (a write's own event is delivered off its response only for
     * `wait_completed`; see `QuickJSLogView.absorb`), so it still reports the
     * op as uncreated. Updated here with every create this dispatch commits.
     */
    writtenOpIds?: Set<string>;
    /** Queue message id of this delivery, recorded on step and wait creates. */
    creatorMessageId?: string;
    /** Queue namespace for all message publishes (see runtime.ts). */
    namespace: string | undefined;
    /**
     * Run-origin trace carrier accessor from runtime.ts. In the default
     * `linked` trace mode this returns the carrier of the run's ORIGIN
     * context (workflow.start), so every invocation links back to the
     * start in a star. Capturing the current context here instead would
     * chain invocations to each other and fragment the run view on async
     * queues.
     */
    nextTraceCarrier: () => Promise<Record<string, string>>;
    /**
     * When true (the inline loop), a step carrying `serializationError` is
     * finalized as step_created (placeholder input) + step_failed so the
     * live-VM feed rejects the step's promise and workflow code can catch
     * it, mirroring the node:vm engine's finalizeUnserializableStep. When
     * false (the terminal drain), such steps are skipped entirely: the run
     * is already completing/failing, no replay follows the drain to observe
     * the failure, and a completed run carrying a failed step would read as
     * a bug from the dashboard, matching the node:vm drain's behavior.
     */
    finalizeUnserializableSteps?: boolean;
    /** The spec version the dispatch's events are stamped with. */
    eventSpecVersion: number;
    /**
     * Whether a creation records its execution mode and run (`inline`,
     * `workflowName`, `attempt` on a placeholder's `step_failed`), as a spec 9
     * run's log does. The spec 8 orchestrator writes main's shapes.
     */
    stampCreations: boolean;
    /**
     * Whether a hook create that committed a `hook_conflict` re-enqueues the
     * run, so a fresh invocation consumes the conflict (the spec 8
     * orchestrator). The spec 9 orchestrator feeds it to the live VM instead,
     * and reports it in `createdHookConflict`.
     */
    requeueOnHookConflict?: boolean;
    /**
     * Writes the pass's `step_created` and `wait_created` events as creation
     * batches rather than one write each (the spec 9 orchestrator, on a World
     * with `createBatch`). See {@link CreationBatches}.
     */
    creationBatches?: CreationBatches;
    wfdiag: (checkpoint: string, fields: Record<string, unknown>) => void;
}): Promise<{
    createdAttributeEvent: boolean;
    createdGetConflictHook: boolean;
    /**
     * A hook create committed a `hook_conflict` instead of a `hook_created`.
     * The workflow consumes it on its next pass: the caller wakes the run if
     * the delivery could end before that.
     */
    createdHookConflict: boolean;
    /**
     * Step cids finalized as failed because their input refused to
     * serialize (see `finalizeUnserializableSteps`). No execution message
     * exists for these; the caller must ensure the run observes the
     * terminal event (the inline loop's feed, or the requeue signal).
     */
    failedSerializationStepCids: Set<string>;
    /** Event ids of the `step_created` events this dispatch wrote. */
    createdStepEventIds: Map<string, string>;
    /** `createdAt` of the `step_created` events this dispatch wrote. */
    createdStepCreatedAts: Map<string, Date>;
    /** Serialized inputs of the steps this dispatch created. */
    createdStepInputs: Map<string, Uint8Array>;
    /**
     * Steps whose creation committed in a creation batch and that were handed
     * to {@link CreationBatches.onStepsCreated}.
     */
    reportedStepCids: Set<string>;
}>;
/**
 * How {@link dispatchPendingOps} writes a pass's step and wait creations as
 * creation batches.
 */
export interface CreationBatches {
    /**
     * Sends one creation batch through the orchestrator's in-band writer and
     * folds what it committed into the log view. A whole-batch failure
     * rejects.
     */
    write(events: CreateEventRequest[]): Promise<EventBatchResult>;
    /**
     * Called once per committed batch with the steps it created, as soon as
     * it committed: the caller sends their step messages while the batches
     * behind it go out. Never called for a step whose creation did not commit.
     */
    onStepsCreated(steps: CreatedBatchStep[]): Promise<void>;
}
/** A step a creation batch created. */
export interface CreatedBatchStep {
    step: PendingStep;
    /** The committed `step_created`'s event id. */
    eventId: string;
    /** The committed `step_created`'s `createdAt`. */
    createdAt: Date;
    /** The step's serialized (possibly encrypted) input. */
    input: Uint8Array | undefined;
}
//# sourceMappingURL=quickjs-pending-ops.d.ts.map