import type { SessionEvent } from "#protocol/session-event.js";
import type { Cause, ErrorInfo, Usage } from "#protocol/session-events/envelope.js";
import type { Fact, FactOf } from "#protocol/session-events/facts.js";
import type { ModelOwner } from "#protocol/session-events/families/model.js";
import type { SessionProjection } from "#protocol/session-projection.js";
import type { ControlDelivery } from "#harness/types.js";
import type { JsonObject } from "#shared/json.js";
/** `value` without the fields it leaves undefined. */
export declare function defined<T extends object>(value: T): T;
/** A fact of `type`, without the fields its data leaves undefined. */
export declare function fact<T extends Fact["type"]>(type: T, data: FactOf<T>["data"]): FactOf<T>;
/** Spend as `usage.recorded` carries it: every count, zero when unreported, and a known cost. */
export declare function usageOf(counts: Partial<Usage>): Usage;
/** A failure as the stream reports it: its code and message, with its support id and remedy. */
export declare function errorInfoOf(failure: {
    readonly code: string;
    readonly details?: JsonObject;
    readonly message: string;
}): ErrorInfo;
/**
 * The facts that end a session, in one commit, `session.ended` last. The writer closes what the
 * session leaves open before it (`cascade`): an open turn ends cancelled, since its session ended,
 * not it; `failure(view, turnId)` reads the session's error. Every reader stops there.
 */
export declare function sessionEndedFacts(projection: Pick<SessionProjection, "view"> | undefined, ending: {
    readonly outcome: "completed" | "failed";
    readonly cause?: Cause;
    /** The reset control that ends the session: admitted first, applied before the end. */
    readonly control?: ControlDelivery;
    /** Controls that arrived before the session started, which settle as it starts. */
    readonly settles?: readonly ControlSettlement[];
    readonly error?: ErrorInfo;
}): SessionEvent[];
/** How a turn ends. */
export interface TurnEnding {
    readonly outcome: FactOf<"turn.settled">["data"]["outcome"];
    readonly cause?: Cause;
    readonly error?: ErrorInfo;
}
/**
 * The fact that ends a turn, the open one unless `turnId` names another, with what it replied.
 * The writer closes what it leaves open before it, and settles the deliveries it answered after
 * it (`cascade`).
 */
export declare function turnSettled(projection: SessionProjection, ending: TurnEnding, turnId?: string | undefined): SessionEvent[];
/** A model run is asked for: a turn's, or a context change's summary run. */
export declare function runRequested(owner: ModelOwner, runId: string): SessionEvent;
/** The run's model was chosen and an attempt at its provider call begins. */
export declare function runStarted(input: {
    readonly runId: string;
    readonly modelId: string;
    readonly attempt: number;
}): SessionEvent;
/** How a run ended, and what it spent. */
export interface RunSettlement {
    readonly runId: string;
    readonly outcome: FactOf<"model.settled">["data"]["outcome"];
    readonly finishReason?: string;
    readonly generationId?: string;
    readonly error?: ErrorInfo;
    readonly usage?: Usage;
}
/** The facts that settle a run: its end, then what it spent. */
export declare function runSettledFacts(input: RunSettlement): SessionEvent[];
/**
 * What the agent behind a call spent, recorded against the call; without one, spend that arrived
 * after its call settled, which no open entity owns (`delegated-late`).
 */
export declare function delegatedUsageFact(callId: string | undefined, usage: Usage): SessionEvent;
/** A context change starts. */
export declare function contextStarted(data: FactOf<"context.started">["data"]): SessionEvent;
/** A control's admission: the delivery it arrived as, its kind, and who sent it. */
export declare function controlAdmitted(delivery: ControlDelivery, control: string): SessionEvent;
/** A control's admission and settlement, recorded together. */
export interface ControlSettlement {
    readonly control: ControlDelivery;
    /** The control's kind as it arrived; an owner may receive one it doesn't know. */
    readonly source: string;
    readonly outcome: "ignored" | "applied" | "failed";
    readonly reason?: string;
}
/** A control that finishes without a step of its own, admitted and settled together. */
export declare function controlSettled(settlement: ControlSettlement): SessionEvent[];
/** A control or callback delivery's settlement once what it asked has happened. */
export declare function deliveryApplied(deliveryId: string): SessionEvent;
