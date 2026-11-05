import { z } from "#compiled/zod/index.js";
import type { Envelope, ErrorInfo } from "../envelope.js";
export interface TaskStartedData {
    readonly taskId: string;
    /** The call that started the task; it also gets `call.started {taskId}`. */
    readonly startedBy: {
        readonly callId: string;
    };
    /** `agent` for a subagent, `tool` for an authored tool. Open. */
    readonly kind: "agent" | "tool" | (string & {});
    readonly name: string;
}
export type TaskOutcome = "completed" | "failed" | "cancelled";
export interface TaskEndedData {
    readonly taskId: string;
    readonly outcome: TaskOutcome;
    /** Open: why a task was cancelled, such as `task-cancel`, `turn-cancelled`, or `session-ended`. */
    readonly reason?: string;
    readonly error?: ErrorInfo;
}
export type TaskStarted = Envelope<"task.started", TaskStartedData>;
/** A task ends once; individual calls it serves settle separately with `call.settled`. */
export type TaskEnded = Envelope<"task.ended", TaskEndedData>;
export type TaskFact = TaskStarted | TaskEnded;
export declare const taskSchemas: {
    "task.ended": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"task.ended">;
    }, z.core.$strip>;
    "task.started": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"task.started">;
    }, z.core.$strip>;
};
