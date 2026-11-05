import { z } from "#compiled/zod/index.js";
import type { Cause, Envelope, ErrorInfo } from "../envelope.js";
/** The eve instance serving a session, for eval reporters. */
export interface RuntimeIdentity {
    readonly agentId: string;
    readonly agentName?: string;
    readonly eveVersion: string;
    readonly build?: {
        readonly deployedAt?: string;
        readonly gitBranch?: string;
        readonly gitSha?: string;
    };
}
/** W3C trace coordinates, for correlating a session with an observability backend. */
export interface TraceContext {
    readonly traceId: string;
    readonly spanId: string;
    readonly traceFlags: number;
}
/** The retired session replaced by this one; its recorded history stays readable. */
export interface SessionPredecessor {
    readonly sessionId: string;
}
export interface SessionStartedData {
    /** The call whose agent opened this session, for a child session. */
    readonly parent?: {
        readonly sessionId: string;
        readonly callId: string;
    };
    /**
     * The session this one replaced, when eve started it in place of one whose deployment was
     * retired. Its recorded stream stays readable.
     */
    readonly predecessor?: SessionPredecessor;
    readonly runtime?: RuntimeIdentity;
    readonly trace?: TraceContext;
}
export type SessionOutcome = "completed" | "failed";
export interface SessionEndedData {
    readonly outcome: SessionOutcome;
    /**
     * What failed, for a failed session, such as the `{turnId}` it failed in. The error is
     * {@link SessionEndedData.error}: the turn settles `cancelled` without one of its own, and
     * `failure(view, turnId)` reads this one for it.
     */
    readonly cause?: Cause;
    readonly error?: ErrorInfo;
}
export type SessionStarted = Envelope<"session.started", SessionStartedData>;
export type SessionEnded = Envelope<"session.ended", SessionEndedData>;
export type SessionFact = SessionStarted | SessionEnded;
export declare const sessionSchemas: {
    "session.ended": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"session.ended">;
    }, z.core.$strip>;
    "session.started": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"session.started">;
    }, z.core.$strip>;
};
