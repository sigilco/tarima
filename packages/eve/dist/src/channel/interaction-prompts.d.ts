import type { Principal } from "#protocol/session-events/envelope.js";
import type { InteractionOpenedData, InteractionOutcome, InteractionRequest, InteractionSettledData } from "#protocol/session-events/families/interaction.js";
import type { ResponseSettledData } from "#protocol/session-events/families/response.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
import { type Interaction } from "#protocol/session-projection/reader.js";
import type { Answer } from "#shared/input.js";
export { interaction, signInEnding, type Interaction, } from "#protocol/session-projection/reader.js";
/** One commit's requests: what a person is asked at once. */
export interface RequestBatch {
    readonly requests: readonly Interaction[];
    readonly turnId: string;
    /** The task whose run asks. */
    readonly taskId?: string;
    /** The call a relayed request serves. */
    readonly callId?: string;
}
/** How a request ended, with the answer that decided it and who gave it. */
export interface RequestSettlement {
    readonly interactionId: string;
    readonly kind: InteractionRequest["kind"];
    readonly outcome: InteractionOutcome;
    readonly reason?: string;
    readonly answer?: Answer;
    /** Who gave the deciding answer, through its delivery. */
    readonly responder?: Principal;
}
/** An answer a check or policy refused, for telling its responder privately. */
export interface RefusedAnswer {
    readonly interactionId: string;
    readonly outcome: "refused" | "failed";
    readonly reason?: string;
    readonly responder?: Principal;
}
/**
 * The batch an `interaction.opened` begins: every request its commit opened. The batch's other
 * facts return `undefined`, so a channel renders it once.
 */
export declare function requestBatchOf(view: SessionView, data: InteractionOpenedData): RequestBatch | undefined;
/**
 * The request a typed reply answers: the first open one. A budget prompt comes first, since the
 * session settles it before anything else; the rest follow the order they opened. Channels that
 * can only show text show this request alone, so a reply answers the request the person sees.
 */
export declare function firstOpenRequest(view: SessionView): Interaction | undefined;
/** How a request ended, from its `interaction.settled`. */
export declare function requestSettlementOf(view: SessionView, data: InteractionSettledData): RequestSettlement | undefined;
/** An answer a check or policy refused, from its `response.settled`. */
export declare function refusedAnswerOf(view: SessionView, data: ResponseSettledData): RefusedAnswer | undefined;
/** An option's style a channel can render: a style a newer eve added reads as none. */
export declare function optionStyle(option: {
    readonly style?: string;
}): "primary" | "danger" | "default" | undefined;
