import { z } from "#compiled/zod/index.js";
import type { Cause, Envelope, ErrorInfo, JsonValue, ValueReference } from "../envelope.js";
/**
 * What made a call: a model run, the call it runs inside, or its turn, for a call no model run
 * asked for. A newer eve can add one.
 */
export type CallOwner = {
    readonly runId: string;
} | {
    readonly callId: string;
} | {
    readonly turnId: string;
};
/**
 * What a call can invoke: a tool, an agent, a skill to load, or `control`, the model managing its
 * own tasks (waiting on or cancelling them), which readers showing activity usually leave out. A
 * newer eve can add one: a reader's switch keeps a default branch.
 */
export type CapabilityKind = "tool" | "agent" | "skill" | "control";
/** What a call invokes. */
export interface Capability {
    readonly kind: CapabilityKind;
    readonly name: string;
    readonly label?: string;
    /** An `agent` another deployment serves: a remote agent, not a subagent of this one. */
    readonly remote?: true;
}
/** A preview of a call's input as the model writes it. The first record announces the call. */
export interface CallInputData {
    readonly callId: string;
    /** On the announcing record only: the entry the model calls, and what it invokes. */
    readonly name?: string;
    readonly kind?: CapabilityKind;
    readonly delta: string;
}
export interface CallRequestedData {
    readonly callId: string;
    readonly owner: CallOwner;
    readonly capability: Capability;
    readonly input?: JsonValue;
    readonly inputRef?: ValueReference;
    /** The model's input didn't validate; the call settles `failed` and never runs. */
    readonly inputError?: ErrorInfo;
}
/** What cleared a call to run. Absent when it needed no approval. */
export type ClearedBy = {
    readonly policy: string;
} | {
    readonly interactionId: string;
};
export interface CallStartedData {
    readonly callId: string;
    readonly clearedBy?: ClearedBy;
    /** The task that serves the call. */
    readonly taskId?: string;
}
/** A bounded snapshot of a call's output so far; the latest replaces earlier ones. */
export interface CallProgressData {
    readonly callId: string;
    readonly output: JsonValue;
    /** The call's label for this output, from the tool. */
    readonly label?: string;
}
export type CallOutcome = "completed" | "failed" | "rejected" | "interrupted" | "abandoned";
export interface CallSettledData {
    readonly callId: string;
    readonly outcome: CallOutcome;
    readonly output?: JsonValue;
    readonly outputRef?: ValueReference;
    /** The call whose `call.settled` carries this call's output, for calls a reply settled together. */
    readonly outputOf?: {
        readonly callId: string;
    };
    readonly error?: ErrorInfo;
    /** Open: `turn-cancelled` and `authorization-required` for interrupted calls, among others. */
    readonly reason?: string;
    /** Who rejected the call: `{interactionId}` or `{policy}`. */
    readonly cause?: Cause;
    /** The call's label once it settled, from the tool. */
    readonly label?: string;
}
export type CallInput = Envelope<"call.input", CallInputData>;
export type CallRequested = Envelope<"call.requested", CallRequestedData>;
export type CallStarted = Envelope<"call.started", CallStartedData>;
export type CallProgress = Envelope<"call.progress", CallProgressData>;
export type CallSettled = Envelope<"call.settled", CallSettledData>;
export type CallFact = CallRequested | CallStarted | CallSettled;
export type CallProgressRecord = CallInput | CallProgress;
export declare const clearedBySchema: z.ZodUnion<readonly [z.ZodObject<{
    policy: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    interactionId: z.ZodString;
}, z.core.$strip>]>;
export declare const callSchemas: {
    "call.requested": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"call.requested">;
    }, z.core.$strip>;
    "call.settled": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"call.settled">;
    }, z.core.$strip>;
    "call.started": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"call.started">;
    }, z.core.$strip>;
};
export declare const callProgressSchemas: {
    "call.input": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"call.input">;
    }, z.core.$strip>;
    "call.progress": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"call.progress">;
    }, z.core.$strip>;
};
