import { type ChannelAudience } from "#shared/channel-audience.js";
export type InstrumentationDecision = {
    readonly action: "drop";
} | {
    readonly action: "record";
    readonly recordInputs: boolean;
    readonly recordOutputs: boolean;
    /** The audience for which an explicit policy authorized content. */
    readonly explicitContentAudience?: ChannelAudience;
};
export declare const DROP_INSTRUMENTATION: InstrumentationDecision;
/** Reads durable decision state, treating malformed persisted values as drop. */
export declare function readInstrumentationDecision(value: unknown): InstrumentationDecision | undefined;
export declare function intersectInstrumentationDecisions(left: InstrumentationDecision, right: InstrumentationDecision): InstrumentationDecision;
