import type { SessionInboxAddress } from "#execution/session-inbox/address.js";
import type { DeliverPayload } from "#channel/types.js";
import type { Relay, WorkflowAskRoute } from "#harness/hitl/relays.js";
import type { SessionStateMap } from "#harness/types.js";
import type { Answer } from "#shared/input.js";
/** The answers of a routed deliver payload that go to one asker. */
export interface RoutedChildDelivery {
    readonly workflowAsk?: WorkflowAskRoute;
    readonly remote?: Relay["remote"];
    readonly inputSource?: string;
    readonly childContinuationToken: string;
    readonly childSessionInbox?: SessionInboxAddress;
    /** The person's message whose text answered this bucket's question. */
    readonly message?: DeliverPayload["message"];
    readonly payload: {
        readonly answers: readonly Answer[];
    };
}
/**
 * Outcome of splitting one deliver payload by the session's relay routes.
 * `forSelf` is the parent-local remainder (or `undefined` when fully
 * routed); `forChildren` carries one entry per asker.
 */
export interface RoutedDeliverPayload {
    readonly forChildren: readonly RoutedChildDelivery[];
    readonly forSelf: DeliverPayload | undefined;
    /** Stop on a child's budget prompt: this session's turn ends too. */
    readonly parentAction: {
        readonly kind: "cancel-turn";
        readonly answer: Answer;
    } | undefined;
}
/**
 * Splits a deliver payload into parent-local and proxied-child buckets.
 *
 * With `resolveMessage`, a plain-text message is also resolved against the
 * first open request when a child asked it, whether a `ctx.ask()` question, a
 * tool approval, or a budget prompt: a matching option or permitted free
 * text answers that one request, and the message is consumed along with its
 * `context`. Otherwise the message stays with the parent.
 */
export declare function routeDeliverPayload(input: {
    readonly allowRoute?: (interactionId: string) => boolean;
    readonly payload: DeliverPayload;
    readonly resolveMessage?: boolean;
    readonly state: SessionStateMap | undefined;
}): RoutedDeliverPayload;
