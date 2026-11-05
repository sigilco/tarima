import type { SessionAuthContext } from "#channel/types.js";
import type { SessionStateMap, HarnessStepInput } from "#harness/types.js";
/**
 * Answering a request does not make the responder the turn's caller. When
 * `stepInput` only answers requests, returns it with each answer to an open
 * approval naming its responder, so approval policies and the approved call
 * see the responder while the turn keeps its caller. Another principal's
 * answer to a request that is no longer open settles nothing, and as text it
 * would steer the open turn, so it is dropped. Returns `undefined` when the
 * input carries a message, or only stale answers the sender may turn into
 * text; its sender becomes the caller.
 */
export declare function attributeAnswers(input: {
    /** The open turn's caller; `undefined` when the delivery starts a turn. */
    readonly owner?: SessionAuthContext | null;
    readonly responder: SessionAuthContext | null;
    readonly state: SessionStateMap | undefined;
    readonly stepInput: HarnessStepInput | undefined;
}): HarnessStepInput | undefined;
