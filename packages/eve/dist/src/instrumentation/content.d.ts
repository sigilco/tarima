import type { InstrumentationEvent } from "#instrumentation/lifecycle.js";
import type { InstrumentationDecision } from "#shared/instrumentation-decision.js";
/** Returns an immutable event projection with conversation content removed. */
export declare function withoutInstrumentationContent(event: InstrumentationEvent): InstrumentationEvent;
/** Inputs enter the agent; responses, requests for a person, metadata and errors leave it. */
export declare function withInstrumentationDecision(event: InstrumentationEvent, decision: Extract<InstrumentationDecision, {
    action: "record";
}>): InstrumentationEvent;
/** Provider metadata fields that describe cost, identity, or routing rather than content. */
export declare function structuralProviderMetadata(metadata: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>>;
