import type { ControlDelivery } from "#harness/types.js";
import { type ChannelAdapterContext } from "#channel/adapter.js";
import { type ContextContainer } from "#context/container.js";
import { type RunEffectsInput } from "#definitions/kernel.js";
import { type DurableSession, type DurableSessionState } from "#execution/durable-session-store.js";
import { type Transition } from "#harness/session-machine/commit.js";
import { type SessionView as MachineView } from "#harness/session-machine/view.js";
import { type HarnessModelMessage } from "#harness/messages.js";
import type { HandleEventFn, HarnessSession, HarnessSessionBase, SessionPublication } from "#harness/types.js";
import type { SessionStreamEvent } from "#protocol/session-event.js";
import type { FactPosition, StoredLine } from "#protocol/session-events/envelope.js";
import { type SessionProjection } from "#protocol/session-projection.js";
import type { Cause, ErrorInfo } from "#protocol/session-events/envelope.js";
import type { ControlSettlement } from "#harness/facts.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
/**
 * Whose event a session publishes. Every event reaches the channel adapter, the
 * session stream, and stream-event hooks. The session's own events also reach
 * its instrumentation and carry its turn's delivery ids.
 *
 * A relayed event belongs to an exchange this session carries for a child
 * session or a workflow run: the question or sign-in it raised, the turn
 * boundary that question causes here, and the `interaction.settled` for the answer
 * this session routes back. This session's instrumentation never tracks that
 * pending input, so no event of the exchange reaches it; the child records its
 * side as its own.
 */
export type SessionEventOrigin = "own" | "relayed";
/** The session a step publishes to: its stream and the state it starts from. */
export interface SessionStepState {
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
    readonly sessionWritable: WritableStream<Uint8Array>;
}
/** A {@link SessionStepState} with the conversation history, for a step that reads or changes it. */
export interface SessionHistoryStepState extends SessionStepState {
    readonly history: HarnessModelMessage[];
}
/** The context and session state a publication leaves behind. */
export interface PublishedSessionEvents {
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
}
/**
 * Publishes a session step's own events, such as a workflow tool's
 * `call.progress`, exactly as a turn publishes its events. Call from a step
 * and adopt the result: hooks run in the session's context and may change it.
 */
export declare function publishSessionEvents(target: SessionStepState, publications: readonly SessionPublication[], options?: {
    readonly canCancelTurn?: boolean;
}): Promise<PublishedSessionEvents & {
    readonly cancelled: boolean;
}>;
/** A session step's context and session, restored so the step can publish. */
export interface RestoredSessionStep {
    readonly ctx: ContextContainer;
    readonly durableSession: DurableSession;
    readonly sessionWritable: WritableStream<Uint8Array>;
}
/** A {@link RestoredSessionStep} with the history, so its publication sees a whole session. */
export interface RestoredSessionHistoryStep extends RestoredSessionStep {
    readonly history: HarnessModelMessage[];
}
export declare function restoreSessionStep(step: SessionStepState): Promise<RestoredSessionStep>;
/**
 * What a session step publishes, and how it changes the session the
 * publication leaves. `S` is a {@link HarnessSession} only for a step
 * restored with its history.
 */
export interface SessionStepPublication<T, R, S extends HarnessSessionBase = HarnessSessionBase> {
    /** A hook stops this publication's running turn; its owner adopts the cancellation after commit. */
    readonly cancelTurn?: () => void;
    readonly origin: SessionEventOrigin;
    /** Where a relayed input batch came from; the channel adapter and its forwarding see it. */
    readonly inputSource?: string;
    /** Emits the step's events in the session's context scope. */
    publish(emit: HandleEventFn, session: S): Promise<T>;
    /**
     * Changes the step makes to the session once the scope has committed it,
     * before its continuation token is reconciled.
     */
    updateSession?(session: S, published: T): SessionUpdate<R, S>;
}
/** The session a step keeps, and anything it derived while changing it. */
export interface SessionUpdate<R, S extends HarnessSessionBase = HarnessSessionBase> {
    readonly session: S;
    readonly result?: R;
}
/**
 * Publishes from a step that owns the session. Returns the context and session
 * state to adopt, and the result of `updateSession`. `step.ctx` is updated in place.
 * The history is published and returned only when the step was restored with it.
 */
export declare function publishFromSessionStep<T, R = undefined>(step: RestoredSessionHistoryStep, publication: SessionStepPublication<T, R, HarnessSession>): Promise<{
    readonly published: PublishedSessionEvents & {
        readonly history: HarnessModelMessage[];
    };
    readonly result: R | undefined;
}>;
export declare function publishFromSessionStep<T, R = undefined>(step: RestoredSessionStep, publication: SessionStepPublication<T, R>): Promise<{
    readonly published: PublishedSessionEvents;
    readonly result: R | undefined;
}>;
/**
 * Holds a session's stream for one step, which keeps its writer lock until it
 * releases it. Events reach the stream through `SessionEventPublisher.emit`.
 */
export interface SessionEventWriter {
    /** Closes the session stream; only a terminal event (`done`, completion, or failure) does this. */
    close(): Promise<void>;
    /** Releases the writer lock so the next step can acquire it. Safe after `close()`. */
    release(): void;
}
/** One event as written: as readers read it back, with where it sits on the stream. */
export interface WrittenEvent {
    readonly event: SessionStreamEvent;
    readonly position: FactPosition;
    /** It rode as a progress record, which only hooks keyed on its type hear. */
    readonly progress: boolean;
    /** Immutable table snapshot after this record's whole line, not a later concurrent write. */
    readonly view: SessionView;
}
/** Dispatches a session's written events to its channel and stream-event hooks. */
export interface SessionEventDispatcher {
    /** The context delivery hands the channel adapter; a turn step also hands it to `adapter.deliver`. */
    readonly adapterCtx: ChannelAdapterContext;
    /** Runs the effects of written events; see `definitions/kernel.ts`. */
    react(written: readonly WrittenEvent[], options?: Omit<RunEffectsInput, "written">): Promise<void>;
}
/** A session's stream held by one step, with the dispatch of the events that step publishes. */
export interface SessionEventPublisher {
    readonly dispatcher: SessionEventDispatcher;
    readonly writer: SessionEventWriter;
    /**
     * Writes one publication (a commit's facts on one line, each progress record on its own),
     * folds each line into the step's projection, then runs the channel's handlers. Returns the
     * events as written, for their hooks.
     */
    emit(publication: SessionPublication): Promise<readonly WrittenEvent[]>;
    /** `emit`, then the events' stream-event hooks. */
    publish(publication: SessionPublication): Promise<void>;
    /**
     * Ends a unit of the step's progress: publishes what the tables now say about the open
     * turn waiting on people (`announceWaiting`). Steps call it as they end. A turn step passes
     * whether it stopped for a person; a step that runs while the turn waits leaves it to the
     * tables.
     */
    finish(options?: {
        readonly announce?: boolean;
    }): Promise<void>;
}
/** A line an interrupted attempt of the current step wrote after the step's checkpoint. */
export interface OrphanedLine {
    readonly line: StoredLine;
    readonly position: number;
}
/**
 * The lines an interrupted earlier attempt of this step wrote after the checkpoint: none on a
 * first attempt, unless `always`, for a step that recovers what a failed step's attempts left.
 */
export declare function readOrphanedLines(input: {
    readonly sessionId: string;
    readonly position: number;
    readonly sessionWritable: WritableStream<Uint8Array>;
    readonly always?: boolean;
}): Promise<readonly OrphanedLine[]>;
/**
 * The state a retried step returns, following every line its interrupted attempt wrote. The
 * retry decides from the same checkpoint and writes the same lines again, so this changes
 * nothing; if its decisions changed and it wrote fewer, the lines it left still sit on the
 * stream, and the session folds them instead of writing its next lines over their positions.
 */
export declare function followInterruptedAttempt(sessionWritable: WritableStream<Uint8Array>, state: DurableSessionState): DurableSessionState;
/** The projection with orphaned lines folded in, as if the step had just written them. */
export declare function foldOrphanedLines(projection: SessionProjection, lines: readonly OrphanedLine[]): SessionProjection;
export declare function openSessionEventPublisher(input: {
    readonly cancelTurn?: () => void;
    readonly ctx: ContextContainer;
    readonly origin: SessionEventOrigin;
    readonly sessionWritable: WritableStream<Uint8Array>;
    readonly inputSource?: string;
    /**
     * What an interrupted attempt of this step already wrote. Each line the publication would
     * write again is folded from the stream instead, and its handlers and hooks don't run again.
     */
    readonly orphaned?: readonly OrphanedLine[];
}): SessionEventPublisher;
/** The session's projection as of the last event it published. */
export declare function readSessionProjection(ctx: ContextContainer): SessionProjection;
/** How a session ends from outside a turn. */
export interface SessionEnding {
    readonly outcome: "completed" | "failed";
    readonly settles?: readonly ControlSettlement[];
    readonly cause?: Cause;
    /** The reset control that ends the session, when it named its delivery. */
    readonly control?: ControlDelivery;
    readonly error?: ErrorInfo;
}
/**
 * Ends the session from outside a turn: one commit settles what it left open and ends it
 * (`session.ended`), through its channel adapter and instrumentation, then closes the session
 * stream so readers following it reach its end. Stream-event hooks do not run: the ending session
 * may not restore, and no turn scope remains for authored code. Throws only when the session's
 * published tail cannot be read, which the ending must follow.
 *
 * When the context cannot be restored, the commit is only written and the stream closed: the one
 * degraded write of a session event.
 */
export declare function publishTerminalSessionEvent(input: {
    readonly errorId?: string;
    readonly ending: SessionEnding;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState?: DurableSessionState;
    readonly sessionWritable: WritableStream<Uint8Array>;
    /** The session's last turn, for channel handlers' `ctx.session.turn`. */
    readonly turn?: {
        readonly id: string;
        readonly sequence: number;
    };
    /** The turn the event ends, for instrumentation. */
    readonly turnId?: string;
    /** The session's last checkpointed projection: what's open, and the next line's position. */
    readonly projection?: SessionProjection;
}): Promise<void>;
/**
 * The commit of a step that owns the session outside a turn: restore it, decide its transitions
 * against what it restored, publish their events in order, and save what they change.
 * Used by relay-changing steps outside a turn; other steps still publish or apply transitions
 * directly. Batches keep the turn unchanged and contain at most one sign-in snapshot.
 */
export declare function commitSessionStep(target: SessionStepState | RestoredSessionStep, decide: (view: MachineView) => readonly Transition[], options: {
    readonly origin: SessionEventOrigin;
    readonly cancelTurn?: () => void;
    /** Where a relayed input batch came from; see `SessionStepPublication.inputSource`. */
    readonly inputSource?: string;
}): Promise<PublishedSessionEvents>;
