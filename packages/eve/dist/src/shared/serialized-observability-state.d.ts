export declare const SERIALIZED_INSTRUMENTATION_STATE_KEYS: {
    readonly activeChannelDeliveries: "eve.activeChannelDeliveries";
    readonly providerState: "eve.harness.instrumentationState";
};
/** Keeps instrumentation state needed to settle operations opened by a discarded step. */
export declare function preserveSerializedInstrumentationState(original: Record<string, unknown>, interrupted: Record<string, unknown>): Record<string, unknown>;
