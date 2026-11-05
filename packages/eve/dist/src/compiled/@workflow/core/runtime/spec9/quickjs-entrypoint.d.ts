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
import type { Span } from '#compiled/@opentelemetry/api/index.js';
import { type Event, type EventResult, type RunInput, type WorkflowRun } from '#compiled/@workflow/world/index.js';
import { type InBandWriter } from './in-band-writer.js';
export declare function runWorkflowWithQuickJS(params: {
    workflowCode: string;
    workflowName: string;
    workflowRun: WorkflowRun;
    /**
     * Events returned inline by `events.create('run_started', ...)` or by
     * the lazy hook fast path's `hook_received` preload. When they indicate
     * a first invocation, or when `preloadedEventsComplete` attests they
     * are the complete log, they are used as the event log instead of
     * fetching via `events.list`, matching the node:vm engine's fast path.
     */
    preloadedEvents?: Event[];
    /**
     * True when the caller has validated that `preloadedEvents` is the run's
     * COMPLETE event log (e.g. the lazy hook fast path's hasMore-false
     * replay preload). The first-invocation heuristic below only recognizes
     * run_created/run_started-only preloads, so without this attestation a
     * hook-resume preload would be discarded and refetched.
     */
    preloadedEventsComplete?: boolean;
    /**
     * The `events.list` cursor positioned after the last of `preloadedEvents`,
     * when the caller has one. Lets this invocation read incrementally from
     * where the preload ended and ask for an inline delta against it. Without
     * it the first read after the preload starts from the top of the log.
     */
    preloadedCursor?: string | null;
    /**
     * Run input carried through the queue message on first delivery. Used
     * as a last-resort fallback for `run_created.eventData.input` when
     * the event log is incomplete.
     */
    runInput?: RunInput;
    /**
     * The parent OTel span (the outer `WORKFLOW {workflowName}` span from
     * `runtime.ts`). When supplied, VM lifecycle attributes are attached
     * to it for end-to-end visibility.
     */
    parentSpan?: Span;
    /**
     * Server-supplied per-run event ceiling from the run_started response
     * (undefined ⇒ no enforcement). Mirrors the node:vm engine's guard:
     * a runaway run is failed once its log reaches the ceiling. The throw
     * propagates to the replay loop's catch in runtime.ts (the QuickJS
     * dispatch runs inside that loop's try), which classifies it and
     * records run_failed with MAX_EVENTS_EXCEEDED.
     */
    maxEventsLimit?: number;
    /**
     * Queue delivery attempt of the message driving this invocation (from
     * the queue handler's metadata; 1 = first delivery). A redelivery may own
     * wait chains a crashed delivery left (see `ownedWaitChains`), and the
     * step re-send rule reads it.
     */
    deliveryAttempt?: number;
    /**
     * Whether this delivery may hold an orchestrator message the queue
     * coalesced into it (any delivery but its message's first), and so arms
     * the near-due waits of chains it does not own on exit (see
     * `armNearDueTimers` in `delivery.ts`). Absent: it may.
     */
    armsNearDueWaits?: boolean;
    /**
     * Epoch ms past which a delivery with nothing left to run does not linger
     * for work done elsewhere (see `getOrchestratorLingerMs`): the invocation's
     * inline deadline. Absent: no lingering.
     */
    lingerDeadlineMs?: number;
    /**
     * Continues the run in a fresh delivery once this one ends: a handoff of
     * the delivery's message (`{ timeoutSeconds: 0 }`). Absent (standalone
     * callers): a new orchestrator message.
     */
    continueInNextDelivery?: () => Promise<void>;
    /**
     * Queue message ID of the delivery driving this invocation, stamped as
     * `ownerMessageId` on inline lazy step claims so wake replays defer to
     * the in-flight body instead of requeueing the step.
     */
    ownerMessageId?: string;
    /** Request ID of the queue invocation, when the queue provides one. */
    requestId?: string;
    /**
     * The orchestrator's in-band writer. Every event this engine writes goes
     * through it, so the writes are marked in-band and fenced.
     */
    writer?: InBandWriter;
    /**
     * Queue namespace resolved at route registration (runtime.ts). Must be
     * threaded into every message publish: the builders bake the namespace
     * into generated routes, so consumers listen on `__<ns>_wkf_workflow_*`.
     * A publish without it lands on `__wkf_workflow_*` and is never
     * picked up.
     */
    namespace?: string;
    /**
     * Run-origin trace carrier accessor from runtime.ts
     * (getNextTraceCarrier). In the default `linked` trace mode every
     * invocation must link back to the run's origin (workflow.start) in a
     * star; capturing the current invocation context instead would chain
     * invocations to each other and fragment the run view on async queues.
     */
    nextTraceCarrier?: () => Promise<Record<string, string>>;
    /**
     * The wait this invocation is the delayed continuation for, if it is one
     * (`WorkflowInvokePayload.waitContinuation`). Read only to decide the next
     * continuation's idempotency key: a continuation that finds its own wait
     * still pending has spent its key, so the re-arm has to advance the attempt
     * or the world's dedupe window drops it and the wait loses its only timer.
     */
    waitContinuation?: {
        correlationId: string;
        attempt: number;
    };
    /**
     * Turbo mode (the run's first delivery, see `isTurboEnabled`): the caller
     * wrote `run_started` without waiting for it and did not load the log, which
     * holds only the run's creation. The VM starts on an empty log, no snapshot
     * is looked up, and while `optimistic` holds, inline step bodies start
     * before their `step_created`/`step_started` commit, until a suspension has
     * an operation other than a step.
     */
    /**
     * Waits a `run.wakeUp()` asked this delivery to complete whatever their
     * `resumeAt` (`WorkflowInvokePayload.completeWaits`).
     */
    wakeUpWaits?: ReadonlySet<string>;
    /**
     * Called once a step's message went out, with the step's correlation id.
     * The delivery keeps what its committed writes still owe the queue, and
     * sends that itself if it ends early (a fence refusal).
     */
    onStepMessageSent?: (correlationId: string) => void;
    /** Called once a wait's timer message went out, with the wait's id. */
    onWaitTimerSent?: (correlationId: string) => void;
    /**
     * The steps of a log whose message this delivery sends again (see
     * `stepsToReenqueue`), once per invocation. Absent (standalone callers):
     * the re-send rule applied to `deliveryAttempt` on every pass.
     */
    stepResends?: (events: readonly Event[]) => ReadonlySet<string>;
    /** Called for each step whose message this delivery sends again. */
    onStepResent?: (correlationId: string) => void;
    /**
     * A delivery of a message the World sent after it lost its queue: every
     * open wait's chain is this delivery's to arm (see `stepsToReenqueue` for
     * the steps).
     */
    recovery?: boolean;
    /**
     * Waits whose `wait_completed` this delivery committed, filled by the
     * delivery from its writer's accepted events; this engine adds its own
     * completions too. Their chains are this delivery's to arm (see
     * `ownedWaitChains`).
     */
    completedWaits?: Set<string>;
    turbo?: {
        /** The backgrounded `run_started`, folded into the log view on landing. */
        runStarted: Promise<EventResult>;
        /** Settles once `run_started` landed; rejects if it failed. */
        runReadyBarrier: Promise<void>;
        /** Whether inline bodies may start ahead of their start. */
        optimistic: boolean;
    };
}): Promise<{
    timeoutSeconds?: number;
} | void>;
//# sourceMappingURL=quickjs-entrypoint.d.ts.map