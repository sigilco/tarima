import type { SessionStateCursor } from "#execution/session/state-cursor.js";
import type { RuntimeActionResultHookPayload, SessionControlIdentity } from "#channel/types.js";
import type { ControlSettlement } from "#harness/facts.js";
import type { ControlOrigin, DeliveryAdmission, SessionInputQueue } from "#execution/session/input-queue.js";
import { type SessionInboxPayload } from "#execution/session-inbox/inbox.js";
import type { WorkflowToolRunMessage } from "#execution/tools/workflow/messages.js";
/** One canonical admission result, after wire decoding but before turn policy. */
type SessionAdmission = {
    readonly admission: DeliveryAdmission;
    readonly kind: "delivery";
} | {
    readonly kind: "cancel";
    readonly origin?: ControlOrigin;
} | {
    readonly kind: "consumed";
}
/** A control this owner cannot run: settle it failed, so its sender doesn't wait forever. */
 | {
    readonly kind: "unsupported";
    readonly settlement: ControlSettlement;
} | {
    readonly kind: "runtime-action-result";
    readonly payload: RuntimeActionResultHookPayload;
} | {
    readonly kind: "workflow";
    readonly message: WorkflowToolRunMessage;
};
/**
 * Decodes and admits one inbox payload. This boundary never decides whether a
 * delivery steers, starts a turn, or routes to a child; those are selection
 * and delivery-routing policies owned by their respective layers.
 */
export declare function admitSessionInboxPayload(value: SessionInboxPayload, input: {
    readonly queue: SessionInputQueue;
    readonly cursor: SessionStateCursor;
}): Promise<SessionAdmission>;
/** The delivery a control arrived as. */
export declare function controlOrigin(command: SessionControlIdentity): ControlOrigin;
export {};
