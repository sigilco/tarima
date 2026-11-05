import type { AuthorizationChallenge } from "#harness/authorization.js";
import type { Cause } from "#protocol/session-events/envelope.js";
import type { FactOf } from "#protocol/session-events/facts.js";
import type { InteractionOpenedData, InteractionOutcome, InteractionRequest, InteractionSubject } from "#protocol/session-events/families/interaction.js";
import type { ResponseOutcome, ResponseSubmittedData, ResponseValue } from "#protocol/session-events/families/response.js";
import type { ApprovalAsk } from "#harness/session-machine/view.js";
/**
 * A question, approval, or budget prompt opens. An approval is about its call, a budget prompt
 * about its turn; a relayed request names the serving call or task it arrived through.
 */
export declare function interactionOpened(input: {
    readonly interactionId: string;
    readonly request: InteractionRequest;
    readonly subject: InteractionSubject;
    readonly origin?: InteractionOpenedData["origin"];
    readonly audience?: InteractionOpenedData["audience"];
}): FactOf<"interaction.opened">;
/** An approval opens about its call. */
export declare function approvalOpened(ask: ApprovalAsk): FactOf<"interaction.opened">;
/** The interaction a sign-in attempt is: its attempt id, or its connection name without one. */
export declare function signInInteractionId(challenge: Pick<AuthorizationChallenge, "attemptId" | "name">): string;
/** A sign-in's public challenge. Provider callback payloads and credential resolvers stay private. */
export declare function signInOpened(challenge: AuthorizationChallenge, input: {
    readonly subject: InteractionSubject;
    readonly origin?: InteractionOpenedData["origin"];
    readonly prompt?: string;
}): FactOf<"interaction.opened">;
/** What `interaction.opened` carries for a sign-in, as its fact or a relay payload's event. */
export declare function signInRequest(challenge: AuthorizationChallenge, input: {
    readonly subject: InteractionSubject;
    readonly origin?: InteractionOpenedData["origin"];
    readonly prompt?: string;
}): InteractionOpenedData;
/** An interaction ends. `cause` names the response that decided it, or what else settled it. */
export declare function interactionSettled(interactionId: string, outcome: InteractionOutcome, input?: {
    readonly reason?: string;
    readonly cause?: Cause;
    readonly response?: ResponseValue;
}): FactOf<"interaction.settled">;
export declare function responseSubmitted(binding: ResponseSubmittedData): FactOf<"response.submitted">;
export declare function responseAdmitted(responseId: string): FactOf<"response.admitted">;
export declare function responseSettled(responseId: string, outcome: ResponseOutcome, reason?: string): FactOf<"response.settled">;
