import type { EventBinding } from "#runtime/connections/events/state.js";
import type { ConnectionEventPayload } from "#runtime/connections/events/delivery.js";
import type { AlsContext } from "#context/container.js";
/** Re-checks the run's saved binding against the deployed connection before any work runs as its creator. */
export declare function resolveBinding(ctx: AlsContext, binding: EventBinding): {
    binding: EventBinding;
    connection: import("../../types.ts").ResolvedConnectionDefinition;
    events: import("../../types.ts").ResolvedConnectionEvents;
    principal: import("../../../shared/connection-types.ts").ConnectionPrincipal;
} | undefined;
/**
 * Runs one delivery's callback as the watch's creator. A crash before the
 * step completes re-runs the callback, so callbacks are idempotent on
 * deliveryId. A `terminated` delivery then retires the watch.
 */
export declare function dispatchConnectionEventStep(input: {
    readonly serializedContext: Record<string, unknown>;
    readonly binding: EventBinding;
    readonly payload: ConnectionEventPayload;
}): Promise<void>;
