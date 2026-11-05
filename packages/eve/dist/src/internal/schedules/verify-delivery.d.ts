import type { Schedule as VercelSchedule } from "#compiled/@vercel/schedules/index.js";
import { z } from "#compiled/zod/index.js";
declare const queueMessageSchema: z.ZodObject<{
    executionId: z.ZodOptional<z.ZodString>;
    firedAt: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    namespace: z.ZodString;
    payload: z.ZodObject<{
        eve: z.ZodObject<{
            application: z.ZodString;
            collection: z.ZodString;
            version: z.ZodLiteral<1>;
        }, z.core.$loose>;
        payload: z.ZodUnknown;
    }, z.core.$loose>;
    scheduleId: z.ZodString;
    scheduledAt: z.ZodOptional<z.ZodString>;
    source: z.ZodLiteral<"dynamic">;
}, z.core.$loose>;
export type VerifiedScheduleMessage = z.infer<typeof queueMessageSchema>;
export declare class PermanentScheduleMessageError extends Error {
}
export declare function expectScheduleQueueMessage(value: unknown): VerifiedScheduleMessage;
export declare function verifyScheduleDelivery(message: VerifiedScheduleMessage, schedule: VercelSchedule | null, application: string, topic: string): void;
export {};
