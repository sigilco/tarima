import { z } from "#compiled/zod/index.js";
import type { Cause, Envelope, ErrorInfo } from "../envelope.js";
import type { TraceContext } from "./session.js";
export interface TurnStartedData {
    readonly turnId: string;
    readonly cause: Cause;
    /** The turn whose context this one continues; `null` after a clear, or for the first turn. */
    readonly follows: string | null;
    readonly trace?: TraceContext;
}
/**
 * The turn waits on interactions: answers, approvals, or sign-ins that resume its work.
 * The session announces it in the commit that leaves the turn so, and again when someone new
 * is asked. A reader following the stream from a cursor stops here without folding what came
 * before; one that folds reads the same from `waiting(view, turnId)`. Nothing announces the turn
 * going on: its next model run or consumed delivery shows it.
 */
export interface TurnPausedData {
    readonly turnId: string;
    readonly awaiting: readonly {
        readonly interactionId: string;
    }[];
}
export type TurnOutcome = "completed" | "failed" | "cancelled";
export interface TurnSettledData {
    readonly turnId: string;
    readonly outcome: TurnOutcome;
    /** The content parts that answer the turn: its reply text, structured result, or files. */
    readonly reply?: readonly string[];
    readonly cause?: Cause;
    readonly error?: ErrorInfo;
}
export type TurnStarted = Envelope<"turn.started", TurnStartedData>;
export type TurnSettled = Envelope<"turn.settled", TurnSettledData>;
export type TurnPaused = Envelope<"turn.paused", TurnPausedData>;
export type TurnFact = TurnStarted | TurnPaused | TurnSettled;
export declare const turnSchemas: {
    "turn.paused": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"turn.paused">;
    }, z.core.$strip>;
    "turn.settled": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"turn.settled">;
    }, z.core.$strip>;
    "turn.started": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"turn.started">;
    }, z.core.$strip>;
};
