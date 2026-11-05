import { z } from "#compiled/zod/index.js";
/** The data-only part of an accepted command, carried across an HTTP or workflow boundary. */
export interface DeliveryReceipt {
    readonly sessionId: string;
    readonly deliveryId: string;
    /** Opaque value to store with the session state; see `ClientSessionState.inbox`. */
    readonly inbox?: string;
}
export declare const DeliveryResponseSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    sessionId: z.ZodString;
    deliveryId: z.ZodString;
}, z.core.$strip>;
