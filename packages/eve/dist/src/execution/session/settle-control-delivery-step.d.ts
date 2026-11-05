import { type SessionStepState } from "#execution/publish-session-events.js";
import type { ControlSettlement } from "#harness/facts.js";
/** Records a control that finishes without a step of its own, at an owner's committed boundary. */
export declare function settleControlDeliveryStep(input: SessionStepState & {
    readonly settlement: ControlSettlement;
}): Promise<Omit<import("#execution/publish-session-events.js").PublishedSessionEvents & {
    readonly cancelled: boolean;
}, keyof import("./state-delta.ts").SessionStateValues> & import("./state-delta.ts").SessionStateTransition>;
