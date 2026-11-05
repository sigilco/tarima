import { z } from "#compiled/zod/index.js";
import type { Envelope, ErrorInfo } from "../envelope.js";
/** What a model run belongs to: a turn, or a context change's summary. */
export type ModelOwner = {
    readonly turnId: string;
} | {
    readonly changeId: string;
};
export interface ModelRequestedData {
    readonly runId: string;
    readonly owner: ModelOwner;
}
/**
 * An attempt at the run's provider call begins. Repeats while the run is open, once per attempt.
 */
export interface ModelStartedData {
    readonly runId: string;
    /** The model the run's participants chose. */
    readonly modelId: string;
    /**
     * Which try at this model step this is: 0 for the first. A run that replaces one a retry gave
     * up (after it published output) continues the count, so a run's first attempt can be above 0.
     */
    readonly attempt: number;
}
/** An attempt failed, and the same run tries again. The run's status doesn't change. */
export interface ModelRetriedData {
    readonly runId: string;
    /** The attempt that failed. */
    readonly attempt: number;
    readonly error: ErrorInfo;
}
export type ModelOutcome = "completed" | "failed" | "interrupted" | "abandoned";
export interface ModelSettledData {
    readonly runId: string;
    readonly outcome: ModelOutcome;
    /** The provider's finish reason, as an open string: `stop`, `tool-calls`, `length`, …. */
    readonly finishReason?: string;
    readonly generationId?: string;
    readonly error?: ErrorInfo;
}
export type ModelRequested = Envelope<"model.requested", ModelRequestedData>;
export type ModelStarted = Envelope<"model.started", ModelStartedData>;
export type ModelRetried = Envelope<"model.retried", ModelRetriedData>;
export type ModelSettled = Envelope<"model.settled", ModelSettledData>;
export type ModelFact = ModelRequested | ModelStarted | ModelRetried | ModelSettled;
export declare const modelSchemas: {
    "model.requested": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"model.requested">;
    }, z.core.$strip>;
    "model.retried": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"model.retried">;
    }, z.core.$strip>;
    "model.settled": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"model.settled">;
    }, z.core.$strip>;
    "model.started": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"model.started">;
    }, z.core.$strip>;
};
