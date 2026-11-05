import { z } from "#compiled/zod/index.js";
import type { Cause, Envelope, ErrorInfo } from "../envelope.js";
/** A context change's kind. Open: `compaction` and `clear` today. */
export type ContextKind = "compaction" | "clear" | (string & {});
export interface ContextStartedData {
    readonly changeId: string;
    readonly kind: ContextKind;
    /** The turn a threshold compaction ran in. */
    readonly turnId?: string;
    /** The control delivery for a manual change. */
    readonly cause?: Cause;
    /** What started a threshold compaction. */
    readonly trigger?: {
        readonly inputTokens: number;
    };
}
export type ContextOutcome = "completed" | "failed" | "cancelled" | "interrupted";
export interface ContextSettledData {
    readonly changeId: string;
    readonly kind: ContextKind;
    readonly outcome: ContextOutcome;
    /**
     * The change's effect on the conversation: `null` empties it until the next turn, a turn
     * selects that turn. Absent when the conversation is unchanged, as for a compaction.
     */
    readonly selects?: null | {
        readonly turnId: string;
    };
    readonly error?: ErrorInfo;
}
export type ContextStarted = Envelope<"context.started", ContextStartedData>;
export type ContextSettled = Envelope<"context.settled", ContextSettledData>;
export type ContextFact = ContextStarted | ContextSettled;
export declare const contextSchemas: {
    "context.settled": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"context.settled">;
    }, z.core.$strip>;
    "context.started": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"context.started">;
    }, z.core.$strip>;
};
