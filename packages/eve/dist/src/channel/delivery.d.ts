import type { Runtime, SessionCommand, SessionCommandResult } from "#channel/types.js";
import type { Delivery } from "#shared/delivery.js";
/** Turns an accepted internal dispatch into its public, followable receipt. */
export declare function commandDelivery(runtime: Runtime, result: SessionCommandResult<Exclude<SessionCommand, {
    readonly kind: "prewarm";
}>>, deliveryId: string, options?: {
    readonly follow?: boolean;
}): Delivery;
