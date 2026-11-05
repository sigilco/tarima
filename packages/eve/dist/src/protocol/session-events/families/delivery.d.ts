import { z } from "#compiled/zod/index.js";
import type { Envelope, Principal, UserPart } from "../envelope.js";
/**
 * Where a delivery came from: a channel (with the schedule or hook that sent it), a control, or a
 * sign-in callback. A hook's `ctx.continue()` names the hook's slug and the session's channel.
 * The set is open. A parent session records which of its calls sent a child's delivery on its own
 * `child.sent`.
 */
export type DeliverySource = {
    readonly channel: string;
    readonly scheduleId?: string;
    readonly hook?: string;
} | {
    readonly control: string;
} | {
    readonly callback: string;
};
export interface DeliveryAdmittedData {
    readonly deliveryId: string;
    /** Absent for deliveries without auth, such as a sign-in callback. */
    readonly principal?: Principal;
    readonly source?: DeliverySource;
}
/**
 * A message from conversation eve did not run, such as a transcript an app stored. It names no
 * turn or call, and records nothing eve ran.
 */
export interface ImportedMessage {
    /** The app's own id for the message, when it gave one. eve never reads it. */
    readonly id?: string;
    readonly role: "user" | "assistant";
    /** The message's plain text. */
    readonly text: string;
}
export interface DeliveryConsumedData {
    readonly deliveryId: string;
    readonly turnId: string;
    /** What the person sent. Empty for a delivery that only adds context. */
    readonly parts: readonly UserPart[];
    /**
     * Earlier conversation the delivery brought, oldest first. The model reads the history of the
     * deliveries a line consumes before what they sent.
     */
    readonly history?: readonly ImportedMessage[];
}
export type DeliveryOutcome = "handled" | "awaiting-input" | "applied" | "ignored" | "refused" | "failed";
export interface DeliverySettledData {
    readonly deliveryId: string;
    readonly outcome: DeliveryOutcome;
    /** The turn whose reply answers the delivery, when it started or joined one. */
    readonly turnId?: string;
    readonly reason?: string;
}
export type DeliveryAdmitted = Envelope<"delivery.admitted", DeliveryAdmittedData>;
export type DeliveryConsumed = Envelope<"delivery.consumed", DeliveryConsumedData>;
export type DeliverySettled = Envelope<"delivery.settled", DeliverySettledData>;
export type DeliveryFact = DeliveryAdmitted | DeliveryConsumed | DeliverySettled;
export declare const deliverySchemas: {
    "delivery.admitted": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"delivery.admitted">;
    }, z.core.$strip>;
    "delivery.consumed": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"delivery.consumed">;
    }, z.core.$strip>;
    "delivery.settled": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"delivery.settled">;
    }, z.core.$strip>;
};
