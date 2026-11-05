import type { Delivery } from "#shared/delivery.js";
import { type SessionView } from "#protocol/session-projection/public-view.js";
import type { SessionStreamEvent } from "#protocol/session-event.js";
import { type ClientSession } from "#client/session.js";
import type { ClientSessionState, SendTurnInput, SendTurnOptions, RespondTurnOptions } from "#client/types.js";
import type { TraceContext } from "#protocol/session-events/families/session.js";
import type { Answer } from "#shared/input.js";
import type { Interaction } from "#protocol/session-projection/reader.js";
import { AssertionCollector } from "#evals/assertions/collector.js";
import type { EveEvalAgentSession, EveEvalAssertions, EveEvalLiveTurn, EveEvalOutputAssertions, EveEvalSession, EveEvalSessionResult, EveEvalTurn, EveEvalWatchOptions } from "#evals/types.js";
import type { EveEvalInteractionMatchOptions } from "#evals/match.js";
/**
 * Error thrown by {@link EveEvalTurn.expectOk} when a turn failed.
 */
export declare class EveEvalTurnFailedError extends Error {
    /** The `turn.settled` or `session.ended` that reported the failure. */
    readonly event: SessionStreamEvent | undefined;
    readonly turn: EveEvalTurn;
    constructor(turn: EveEvalTurn);
}
export interface EvalSessionDriver extends EveEvalAssertions, EveEvalOutputAssertions {
}
export interface EvalSessionStartedEvent {
    readonly primary: boolean;
    readonly sessionId: string;
    readonly startedAt: string;
    readonly traceContext: TraceContext;
}
export declare class EvalSessionDriver implements EveEvalSession {
    #private;
    constructor(input: {
        readonly collector: AssertionCollector;
        readonly onSessionStart?: (event: EvalSessionStartedEvent) => void;
        readonly primary: boolean;
        readonly session: ClientSession;
        readonly onTurn: (session: EvalSessionDriver) => void;
        readonly signal?: AbortSignal;
        /** What this eval already read of the session before this driver attached. */
        readonly history?: readonly SessionStreamEvent[];
    });
    get events(): readonly SessionStreamEvent[];
    get view(): SessionView;
    get transcript(): string;
    get lastInput(): string;
    get lastTurn(): EveEvalTurn | undefined;
    get pendingInteractions(): readonly Interaction[];
    get id(): string;
    get state(): ClientSessionState;
    cancel(): Promise<Delivery>;
    compact(): Promise<EveEvalTurn>;
    agent(opened: Extract<SessionStreamEvent, {
        type: "child.opened";
    }>): EveEvalAgentSession;
    requireInteraction(filter?: EveEvalInteractionMatchOptions): Interaction;
    respond(responses: readonly Answer[], options?: RespondTurnOptions): Promise<EveEvalTurn>;
    startRespond(responses: readonly Answer[], options?: RespondTurnOptions): Promise<EveEvalLiveTurn>;
    respondAll(optionId: string): Promise<EveEvalTurn>;
    send(message: SendTurnInput["message"], options?: SendTurnOptions): Promise<EveEvalTurn>;
    start(message: string, options?: SendTurnOptions): Promise<EveEvalLiveTurn>;
    sendFile(text: string, filePath: string, mediaType?: string): Promise<EveEvalTurn>;
    nextTurn(options?: EveEvalWatchOptions): Promise<EveEvalTurn>;
    watch(options?: EveEvalWatchOptions): EveEvalLiveTurn;
    snapshot(): EveEvalSessionResult;
}
