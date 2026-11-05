import type { InstrumentationScope } from "#instrumentation/lifecycle.js";
/** Public scopes name runs; schema-4 traces retain their per-turn step numbering privately. */
export declare function instrumentationScope(input: Omit<InstrumentationScope, "rootSessionId"> & {
    readonly rootSessionId?: string;
}, stepIndex?: number): InstrumentationScope;
export declare function traceStepIndex(scope: InstrumentationScope): number | undefined;
