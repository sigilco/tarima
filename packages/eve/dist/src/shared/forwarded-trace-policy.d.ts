import type { ChannelAudience } from "#shared/channel-audience.js";
import { type InstrumentationContentContext } from "#shared/instrumentation-content.js";
import type { InstrumentationDecision } from "#shared/instrumentation-decision.js";
export declare const FAIL_CLOSED_FORWARDED_TRACE_ASSERTION: ForwardedTraceAssertion;
export interface TraceContentCeiling {
    readonly recordInputs: boolean;
    readonly recordOutputs: boolean;
}
export interface ForwardedTraceAssertion {
    readonly ceiling: TraceContentCeiling;
    readonly originAudience: ChannelAudience;
}
interface ResolvedForwardedTraceState {
    readonly decision?: InstrumentationDecision;
    readonly forwardedTracePolicy?: ForwardedTraceAssertion;
    readonly traceFlags: number;
}
interface ForwardedTraceSeedState {
    readonly decision?: unknown;
    readonly forwardedTracePolicy?: unknown;
    readonly traceFlags: number;
}
export declare function decisionToTraceContentCeiling(value: unknown): TraceContentCeiling | undefined;
export declare function traceContentCeilingToDecision(ceiling: TraceContentCeiling): InstrumentationDecision;
export declare function formatTraceContentCeiling(ceiling: TraceContentCeiling): string;
/** Applies a distinct live delivery audience without re-capping callback or origin delivery. */
export declare function applyLiveDeliveryAudienceCeiling(decision: InstrumentationDecision, liveAudience: ChannelAudience, forwardedTracePolicy: ForwardedTraceAssertion | undefined, environment: InstrumentationContentContext["environment"]): InstrumentationDecision;
export declare function readForwardedTraceAssertion(value: unknown): ForwardedTraceAssertion | undefined;
export declare function resolveForwardedTraceSeed(seed: ForwardedTraceSeedState | undefined, fallbackPolicy?: ForwardedTraceAssertion): ResolvedForwardedTraceState | undefined;
export {};
