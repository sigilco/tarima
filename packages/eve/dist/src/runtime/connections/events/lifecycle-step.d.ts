import { type ConnectionEventSubscribeOutcome, type ConnectionEventSubscribeResult, type EventBinding } from "#runtime/connections/events/state.js";
import type { ConnectionEventPayload } from "#runtime/connections/events/delivery.js";
/**
 * Subscribes from inside the watch run, after its hook is registered, so a
 * delivery that beats the subscribe response finds the binding it runs under.
 * The key is the run's own: a retried step reuses it, and a later run for the
 * same watch, after this one ended, subscribes afresh.
 */
export declare function openConnectionEventStep(input: {
    readonly serializedContext: Record<string, unknown>;
    readonly binding: EventBinding;
}): Promise<ConnectionEventSubscribeResult>;
/**
 * Connect's definitive refusals reach the model, and the run then ends
 * without a watch. Anything else, such as a timeout after Connect may have
 * created the subscription, throws so the step retries with the same
 * idempotency key.
 */
export declare function subscribeConnectionEvent(serializedContext: Record<string, unknown>, binding: EventBinding, idempotencyKey: string): Promise<ConnectionEventSubscribeResult>;
/**
 * One unsubscribe attempt for a stopped watch. "done" only once Connect has
 * finished cleanup or no longer has the subscription. Anything else, whether
 * Connect still cleaning up, an outage, refused credentials or a connection a
 * redeploy removed, is "pending": the watch keeps its hook and repeats the
 * attempt with its own durable backoff, so Workflow's step retries never
 * decide when cleanup gives up.
 */
export declare function unsubscribeConnectionEventStep(input: {
    readonly serializedContext: Record<string, unknown>;
    readonly binding: EventBinding;
    readonly subscriptionId: string;
}): Promise<"pending" | "done">;
/** Starts a delivery the watch's run took because it arrived before the subscribe response. */
export declare function startConnectionEventDeliveryStep(input: {
    readonly binding: EventBinding;
    readonly serializedContext: Record<string, unknown>;
    readonly payload: ConnectionEventPayload;
}): Promise<void>;
/**
 * Publishes, for a duplicate run's caller, the run that owns the watch.
 */
export declare function publishConnectionEventOutcomeStep(outcome: ConnectionEventSubscribeOutcome): Promise<void>;
