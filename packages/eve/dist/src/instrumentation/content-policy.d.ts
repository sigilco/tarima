import type { InstrumentationEvent } from "#instrumentation/lifecycle.js";
import { type InstrumentationContentContext } from "#shared/instrumentation-content.js";
import type { InstrumentationDecision } from "#shared/instrumentation-decision.js";
/** Applies OpenTelemetry's trace content ceiling to one OTel provider event. */
export declare function instrumentationEventForTraceDecision(event: InstrumentationEvent, decision: InstrumentationDecision, content: InstrumentationContentContext, options?: {
    readonly applyAudienceCeiling?: boolean;
}): InstrumentationEvent;
