import type { MessageContent } from "#shared/message-content.js";
import type { HarnessStepInput } from "#harness/types.js";
import type { SessionView as SessionTables } from "#protocol/session-projection/tables.js";
import type { SessionView } from "#harness/session-machine/view.js";
/**
 * The delivery a step answers with: input queued behind earlier work joins it, unless the
 * runtime still runs calls (queued input waits for them). A stale answer, to a request that
 * already closed, never authorizes anything: a stale session-limit answer is dropped, and
 * any other becomes plain text the model reads.
 */
export declare function deliver(view: SessionView, input: HarnessStepInput | undefined, options: {
    readonly takeQueued: boolean;
    readonly typedAnswers?: boolean;
}): {
    readonly input?: HarnessStepInput;
    readonly displayMessage?: MessageContent;
    readonly takeQueued: boolean;
};
export type ResolvedStepInput = HarnessStepInput & {
    readonly messageConsumed?: boolean;
};
/**
 * Plain text answers a budget prompt; `resolveTypedApproval` answers approvals. A channel
 * that wraps the typed text in an envelope for the model attaches the text itself to answer with.
 * The answer consumes the message, with the context and history the channel sent with it: the
 * model reads none of them.
 */
export declare function resolveTextInput(view: SessionTables, stepInput: HarnessStepInput | undefined): ResolvedStepInput | undefined;
/**
 * Turns a typed reply into a response to the first open request when that request is one of
 * this turn's approvals. The approval coordinator then settles it, or asks its response policy
 * about the person who typed, as it does for a press. A batch's other approvals stay open for
 * later replies.
 */
export declare function resolveTypedApproval(view: Pick<SessionView, "projection" | "turn">, stepInput: HarnessStepInput | undefined): ResolvedStepInput | undefined;
export declare function typedResponseId(deliveryId: string, index: number): string;
export declare function isEmptyInput(input: HarnessStepInput): boolean;
export declare function withoutResponses(input: ResolvedStepInput | undefined): HarnessStepInput | undefined;
/** The turn's own input: the message a plain-text answer didn't consume, and its context. */
export declare function turnInputOnly(input: ResolvedStepInput | undefined): HarnessStepInput | undefined;
/** What of the input isn't the turn's: answers, and the output the session asks for. */
export declare function withoutTurnInput(input: ResolvedStepInput | undefined): ResolvedStepInput;
export declare function compactInput(input: ResolvedStepInput | undefined): ResolvedStepInput;
