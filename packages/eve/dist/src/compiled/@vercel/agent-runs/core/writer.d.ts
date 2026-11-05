import type { PreparedSpan, SpanWriter, ExecutionContext, AgentTelemetry, TraceReference, CaptureDecision, TraceErrorHandler } from "./types.js";
export interface TraceOperation extends SpanWriter {
    readonly capture: CaptureDecision;
    readonly finished: boolean;
    run<T>(execute: () => T): T;
    /** Lowers what the span accepts from now on. */
    narrow(capture: CaptureDecision): void;
}
export declare function createSpanWriter(input: {
    telemetry: Pick<AgentTelemetry, "startSpan" | "run" | "suppressed">;
    onError?: TraceErrorHandler;
}): {
    start: (span: PreparedSpan, capture: CaptureDecision, host?: ExecutionContext, reserved?: TraceReference) => TraceOperation;
    startReserved: (span: PreparedSpan, reference: TraceReference, capture: CaptureDecision, host?: ExecutionContext) => TraceOperation;
};
