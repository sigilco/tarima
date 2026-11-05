import { z } from "#compiled/zod/index.js";
import type { Envelope } from "../envelope.js";
export interface ChildOpenedData {
    /** The child session; its own lifecycle lives in its own stream. */
    readonly sessionId: string;
    readonly owner: {
        readonly callId: string;
    } | {
        readonly taskId: string;
    };
    readonly name: string;
    /** The route that serves the child's stream: its own, or the parent-origin proxy for a remote child. */
    readonly stream: string;
}
/**
 * A delivery a child session accepted for one of this session's calls. The child's own stream
 * records the delivery's lifecycle as its `deliveryId`.
 */
export interface ChildSentData {
    /** The child session that accepted the delivery. */
    readonly sessionId: string;
    /** The delivery's id in the child's stream, not one of this session's deliveries. */
    readonly childDeliveryId: string;
    /** The call the delivery was sent for. */
    readonly callId: string;
}
export type ChildOpened = Envelope<"child.opened", ChildOpenedData>;
export type ChildSent = Envelope<"child.sent", ChildSentData>;
export type ChildFact = ChildOpened | ChildSent;
export declare const childSchemas: {
    "child.opened": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"child.opened">;
    }, z.core.$strip>;
    "child.sent": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"child.sent">;
    }, z.core.$strip>;
};
