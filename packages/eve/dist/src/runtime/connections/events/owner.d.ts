import { type CompiledBundle } from "#runtime/sessions/runtime-context-keys.js";
import type { ConnectionEventPayload } from "#runtime/connections/events/delivery.js";
import { type ConnectionEventSubscribeResult, type EventBinding } from "#runtime/connections/events/state.js";
import type { ManagedEventSubscription } from "#shared/connection-events.js";
/**
 * Starts the watch's run, which subscribes once its hook is registered. A
 * watch already running under the binding's id answers instead. Returns
 * undefined when the subscription is still being created after the caller
 * stops waiting: asking for the same watch again finds it.
 */
export declare function startConnectionEventOwner(binding: EventBinding, bundle: CompiledBundle, signal?: AbortSignal): Promise<ManagedEventSubscription | undefined>;
/**
 * Routes one verified delivery to its watch. Returns false when the watch
 * has ended or never created this subscription, so the receiver tells
 * Connect to stop. A delivery that beats the subscribe response waits in the
 * watch's own hook, and the watch's run starts it once it knows its
 * subscription.
 */
export declare function startConnectionEventDelivery(payload: ConnectionEventPayload, bundle: CompiledBundle): Promise<boolean>;
/** Runs one delivery's callback in its own short run. */
export declare function startConnectionEventDeliveryRun(input: {
    readonly binding: EventBinding;
    readonly serializedContext: Record<string, unknown>;
    readonly payload: ConnectionEventPayload;
}): Promise<void>;
/** Connect's refusal reaches the caller with its status, so a 401 is classified as a sign-in request. */
export declare function subscriptionFromOutcome(outcome: ConnectionEventSubscribeResult): ManagedEventSubscription;
/**
 * A running watch: who owns it and what it subscribed to. The subscription
 * is undefined while it is still being created. An ended watch's hook ended
 * with its run, so it is not found.
 */
export declare function findConnectionEventOwner(bindingId: string): Promise<{
    owner: EventBinding;
    subscription: ManagedEventSubscription | undefined;
} | undefined>;
/** Asks the watch's run to unsubscribe and end; the run repeats unsubscribe until Connect finishes. */
export declare function retireConnectionEventOwner(bindingId: string): Promise<boolean>;
