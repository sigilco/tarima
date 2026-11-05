import { type CreateEventRequest, type Event, type SerializedData, type WorkflowRun } from '#compiled/@workflow/world/index.js';
import type { WorkflowSuspension } from '../../global.js';
import type { PayloadKey } from '../../serialization/encryption.js';
import type { SuspensionSerializationBlocker } from '../delivery.js';
import type { InBandWriter } from './in-band-writer.js';
/** A step this suspension created, and how it executes. */
export interface CreatedStep {
    correlationId: string;
    stepName: string;
    inline: boolean;
    input: SerializedData;
    /**
     * The committed creation: a background step's `step_created`, or an
     * inline step's first `step_started`. Absent only beside
     * {@link startRefusal}.
     */
    event?: Event;
    /**
     * An inline step's committed first `step_started`, which is also its
     * creation. The executor then writes no start of its own.
     */
    started?: StartedInBatch;
    /**
     * Why the World refused an inline step's creation-bearing `step_started`
     * (a throttle, a finished run), as the error a single start write would
     * have thrown. The step is not created; the executor acts on the refusal
     * as on its own start's (a throttle defers the run by the World's backoff,
     * and the next delivery creates the step again).
     */
    startRefusal?: Error;
}
/** The `step_started` that created an inline step. */
export interface StartedInBatch {
    event: Event;
    /** `Date.now()` right before the batch was sent. */
    postSentAtMs: number;
    /** `Date.now()` once the batch returned. */
    completedAtMs: number;
}
export interface StepWaitCreationResult {
    createdSteps: CreatedStep[];
    /** Steps finalized as failed because their arguments did not serialize. */
    failedStepCorrelationIds: Set<string>;
    /** The committed `wait_created` events. */
    createdWaits: Event[];
    serializationBlockerCount: number;
    serializationBlockers: SuspensionSerializationBlocker[];
}
/**
 * Writes the step and wait creations of one suspension through the
 * orchestrator's in-band writer.
 *
 * - Each step's creation records its execution mode, fixed here for good.
 *   The first `inlineSlots` new steps are inline (the orchestrator runs them
 *   in this process): each is created by its first attempt's `step_started`
 *   alone, carrying what a `step_created` carries plus `inline: true`. The
 *   rest are background steps: a `step_created` with `inline: false`, and
 *   they are enqueued once, right after this commit, and never run inline.
 * - Each background step's `step_created` and each `wait_created` records
 *   `creatorMessageId`, the queue message of this delivery: only a
 *   redelivery of it re-enqueues a background step or schedules a wait's
 *   timer. An inline step's creating start records none.
 * - The events go out as one `createBatch` when the World has one, else one
 *   at a time. In-band writes are serialized, so a parallel fan-out of
 *   single writes would be refused by the fence.
 * - A step whose arguments fail to serialize is finalized as `step_created`
 *   (placeholder input) plus `step_failed`, so the workflow observes the
 *   error on the next replay.
 */
export declare function createStepsAndWaits(params: StepWaitCreationParams): Promise<StepWaitCreationResult>;
/**
 * The step and wait creations of one suspension, prepared (inputs
 * serialized, execution modes decided) and not yet written.
 */
export interface StepWaitCreationPlan {
    /** The steps the commit creates, with their execution mode. */
    steps: Omit<CreatedStep, 'event'>[];
    /** How many waits the commit creates. */
    waitCount: number;
    /** How many steps failed to serialize; the commit finalizes them. */
    failedCount: number;
    /** Guest-code executions while serializing step inputs. */
    serializationBlockerCount: number;
    /** A sample of those executions, for diagnostics. */
    serializationBlockers: SuspensionSerializationBlocker[];
    /**
     * The events the commit writes, in order: each step's creation (an
     * inline step's `step_started`, a background step's `step_created`), then
     * the waits' `wait_created`. Steps whose input failed to serialize are not
     * among them.
     */
    events: readonly CreateEventRequest[];
    /** Writes the events. See {@link createStepsAndWaits}. */
    commit(): Promise<StepWaitCreationResult>;
    /**
     * Writes the events as {@link commit} does, and resolves `first` once
     * the first batch and every inline creation committed (inline steps come
     * first in {@link events}), with the steps those batches created. `rest`
     * resolves with the steps the later batches created, once they committed.
     * `queued` resolves once the last batch is queued on the writer (or the
     * commit stopped before it): a write queued after that goes out behind
     * every batch. For a plan with no waits and no step that failed to
     * serialize.
     *
     * `onLaterBatch` is called once per batch after the first, as soon as
     * that batch committed, with the steps it created. A batch that failed
     * is not reported; `rest` rejects with its error.
     */
    commitInChunks(onLaterBatch?: (result: StepWaitCreationResult) => void): {
        first: Promise<StepWaitCreationResult>;
        rest: Promise<StepWaitCreationResult>;
        queued: Promise<void>;
    };
}
export interface StepWaitCreationParams {
    suspension: WorkflowSuspension;
    run: WorkflowRun;
    writer: InBandWriter;
    eventCount: () => number | undefined;
    encryptionKey: PayloadKey | undefined;
    compression: boolean;
    creatorMessageId: string;
    inlineSlots: number;
    requestId?: string;
    /** Called with each accepted write, to fold it into the loaded log. */
    onCommitted?: (result: {
        event?: Event;
        events?: Event[];
        hasMore?: boolean;
    }) => void;
}
/**
 * Prepares one suspension's step and wait creations without writing them. Turbo mode starts inline step bodies from the plan while the
 * commit is in flight; everyone else commits at once
 * ({@link createStepsAndWaits}).
 */
export declare function planStepsAndWaits(params: StepWaitCreationParams): Promise<StepWaitCreationPlan>;
/**
 * Splits a suspension's creations into the batches it writes, one after
 * another, in order: each batch holds up to
 * {@link MAX_IN_BAND_CREATION_BATCH_EVENTS} creations and stays within
 * {@link MAX_IN_BAND_CREATION_BATCH_BYTES} (see {@link creationBatchBytes});
 * a single event over the byte budget still goes out, alone. A suspension of
 * at most {@link MAX_BATCH_EVENTS} creations is therefore one batch unless
 * its payloads overflow the byte budget.
 *
 * The inline steps' creation-bearing starts come first and share the first
 * batch with the background creations behind them. An in-band writer sends
 * one batch at a time, so a batch of their own would put one more round trip
 * in front of every background creation, and of the last branch's start. The
 * trade: the inline bodies start once the larger first batch commits rather
 * than a batch of only their starts. Each step's creation is a single event,
 * so no step's events straddle two batches.
 */
export declare function batchChunks(events: CreateEventRequest[]): CreateEventRequest[][];
/**
 * What one creation counts against {@link MAX_IN_BAND_CREATION_BATCH_BYTES}:
 * the binary payloads on its `eventData` (a step's serialized input) plus
 * {@link CREATION_EVENT_META_ALLOWANCE_BYTES} for the rest of the event.
 */
export declare function creationBatchBytes(event: CreateEventRequest): number;
//# sourceMappingURL=step-wait-creation.d.ts.map