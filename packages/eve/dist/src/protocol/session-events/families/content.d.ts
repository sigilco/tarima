import { z } from "#compiled/zod/index.js";
import type { Envelope, JsonValue, ValueReference } from "../envelope.js";
/** Wire parts use `kind`: `type` names the event. Authoring and UI parts use `type`. */
/** A content part's kind. Open: `text`, `reasoning`, `result`, and `file` today. */
export type ContentKind = "text" | "reasoning" | "result" | "file" | (string & {});
/** Whether a part narrates work the turn continues with, or replies. Open; unknown reads as narration. */
export type ContentPhase = "narration" | "reply" | (string & {});
/** A preview of a part's value. The first record for a part announces it with its kind. */
export interface ContentDeltaData {
    readonly partId: string;
    /** On the announcing record only. */
    readonly kind?: ContentKind;
    readonly delta: string;
}
export interface ContentCompletedData {
    readonly partId: string;
    /** The model run that wrote the part. Absent when its turn wrote it, which `scope.turnId` names. */
    readonly runId?: string;
    readonly kind: ContentKind;
    /** The part's whole value: text for text and reasoning, JSON for a result, a file's metadata. */
    readonly value?: JsonValue;
    readonly valueRef?: ValueReference;
    readonly phase: ContentPhase;
    /** A cancel stopped the part; its value is what streamed. */
    readonly interrupted?: true;
    /** For kinds a reader doesn't know. */
    readonly mediaType?: string;
    readonly fallbackText?: string;
}
export type ContentDelta = Envelope<"content.delta", ContentDeltaData>;
export type ContentCompleted = Envelope<"content.completed", ContentCompletedData>;
export type ContentFact = ContentCompleted;
export type ContentProgress = ContentDelta;
export declare const contentSchemas: {
    "content.completed": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"content.completed">;
    }, z.core.$strip>;
};
export declare const contentProgressSchemas: {
    "content.delta": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"content.delta">;
    }, z.core.$strip>;
};
