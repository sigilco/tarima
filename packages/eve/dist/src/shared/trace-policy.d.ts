import type { ConversationContext } from "#shared/conversation-context.js";
export declare function isSampledTrace(context: {
    readonly traceFlags: number;
}): boolean;
import { type InstrumentationDecision } from "#shared/instrumentation-decision.js";
export type TraceCaptureContext = {
    readonly agentName: string;
} & ConversationContext;
export type TracePolicyDecision = {
    readonly emit: false;
} | {
    readonly emit: true;
    readonly recordInputs: boolean;
    readonly recordOutputs: boolean;
};
export type TraceCapturePolicy = (trace: TraceCaptureContext) => TracePolicyDecision | boolean;
export declare function resolveTracePolicy(policy: TraceCapturePolicy | undefined, trace: TraceCaptureContext, onError?: (error: unknown) => void): InstrumentationDecision;
export declare function resolveTracePolicyDecision(decision: TracePolicyDecision | boolean, context: {
    readonly audience: TraceCaptureContext["audience"];
    readonly environment: TraceCaptureContext["environment"];
}): InstrumentationDecision;
