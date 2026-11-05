import type { ConnectionEventPayload } from "#runtime/connections/events/delivery.js";
import type { EventBinding } from "#runtime/connections/events/state.js";
export type ConnectionEventWatchMessage = {
    readonly kind: "retire";
}
/** A delivery that reached the receiver before this run published its subscription. */
 | {
    readonly kind: "delivery";
    readonly payload: ConnectionEventPayload;
};
/**
 * Holds one watch: its hook carries the binding every delivery runs under,
 * and the run waits until the watch is stopped, terminated or expires.
 * Deliveries run in their own {@link connectionEventDeliveryWorkflow}, so
 * this run's log only grows by the deliveries that arrive before its
 * subscribe response does. The hook ends with the run: an ended watch is
 * not found.
 */
export declare function connectionEventWorkflow(input: {
    readonly binding: EventBinding;
    readonly serializedContext: Record<string, unknown>;
}): Promise<void>;
/** Runs one delivery's callback in its own short run. */
export declare function connectionEventDeliveryWorkflow(input: {
    readonly binding: EventBinding;
    readonly serializedContext: Record<string, unknown>;
    readonly payload: ConnectionEventPayload;
}): Promise<void>;
