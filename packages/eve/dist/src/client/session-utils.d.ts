import type { SessionEvent } from "#protocol/session-event.js";
import { type RequestStatus } from "#protocol/session-projection/request-status.js";
import type { DeliveryOutcome } from "#protocol/session-events/families/delivery.js";
import type { ErrorInfo } from "#protocol/session-events/envelope.js";
import { type Interaction } from "#protocol/session-projection/reader.js";
/** What one response's events say, for a reader that wants the outcome. */
interface TurnEventSummary {
    readonly boundary: SessionEvent | undefined;
    readonly failure: ErrorInfo | undefined;
    /** What the response leaves open for people: answers it asks for, and sign-ins. */
    readonly interactions: readonly Interaction[];
    /** The reply's text, from the parts `turn.settled.reply` lists. */
    readonly message: string | undefined;
    /** The value of the latest `result` part, whatever its phase. */
    readonly result: unknown;
    readonly status: RequestStatus | "working";
    readonly outcome: DeliveryOutcome | undefined;
    readonly sessionEnded: boolean;
}
/**
 * Reduces one response's events into their outcome. It reads the events themselves, not tables
 * folded from them: a response that joins a running turn starts after that turn's
 * `turn.started`, so a fold would never see the turn its `turn.settled` ends.
 */
export declare function summarizeTurnEvents(events: readonly SessionEvent[], deliveryId?: string): TurnEventSummary;
/** Incremental response summary; progress events are folded, not retained. */
export declare function turnSummary(deliveryId?: string): {
    observe(event: SessionEvent): void;
    result(): TurnEventSummary;
};
/** The failure an event reports: a turn's, a run's, or the session's. */
export declare function failureOf(event: SessionEvent): ErrorInfo | undefined;
/** Collects one response's events, through its end. */
export declare function collectTurnEvents(stream: AsyncIterable<SessionEvent>, deliveryId?: string): Promise<readonly SessionEvent[]>;
/**
 * True when a read that follows no delivery ends at `event`: the turn settled, the session
 * ended, or the turn paused on a person, who must act before it goes on.
 */
export declare function endsTurn(event: SessionEvent): boolean;
/**
 * One response's events, from where a reader started, and the requests and sign-ins they leave
 * open. A response to a delivery ends when that delivery settles, however it settles, or when
 * the session ends first; a read that follows no delivery ends with the turn ({@link endsTurn}).
 */
export declare class ResponseSegment {
    #private;
    constructor(options?: {
        readonly deliveryId?: string;
    });
    get interactions(): readonly Interaction[];
    get boundary(): SessionEvent | undefined;
    /** Records `event`; an ending fact ends the response after the rest of its commit. */
    observe(event: SessionEvent): boolean;
}
export {};
