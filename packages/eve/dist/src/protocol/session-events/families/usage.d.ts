import { z } from "#compiled/zod/index.js";
import type { Envelope, Usage } from "../envelope.js";
/** What spent the usage. Absent for usage nothing owns, such as cache warming. */
export type UsageOwner = {
    readonly runId: string;
} | {
    readonly callId: string;
} | {
    readonly changeId: string;
};
export interface UsageRecordedData {
    readonly owner?: UsageOwner;
    /** Open: `model` today. */
    readonly kind: "model" | (string & {});
    readonly usage: Usage;
}
export type UsageRecorded = Envelope<"usage.recorded", UsageRecordedData>;
export type UsageFact = UsageRecorded;
export declare const usageSchemas: {
    "usage.recorded": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"usage.recorded">;
    }, z.core.$strip>;
};
