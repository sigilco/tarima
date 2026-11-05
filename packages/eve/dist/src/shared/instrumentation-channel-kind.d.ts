import type { InstrumentationChannelKind } from "#shared/instrumentation-channel.js";
export declare function isInstrumentationChannelKind(kind: string): kind is InstrumentationChannelKind;
export declare function normalizeInstrumentationChannelKind(rawKind: string | undefined): InstrumentationChannelKind;
