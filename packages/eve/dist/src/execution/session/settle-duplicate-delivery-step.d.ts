import type { DeliverHookPayload } from "#channel/types.js";
import { type SessionStepState } from "#execution/publish-session-events.js";
/** A duplicate starts no work, but its distinct receipt must still settle. */
export declare function settleDuplicateDeliveryStep(input: SessionStepState & {
    readonly delivery: DeliverHookPayload;
}): Promise<Omit<import("#execution/publish-session-events.js").PublishedSessionEvents & {
    readonly cancelled: boolean;
}, keyof import("./state-delta.ts").SessionStateValues> & import("./state-delta.ts").SessionStateTransition>;
