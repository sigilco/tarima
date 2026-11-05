import type { InstrumentationRuntime } from "#instrumentation/runtime.js";
/** Registers the process instrumentation runtime before agent execution begins. */
export declare function registerInstrumentationRuntime(runtime: InstrumentationRuntime): InstrumentationRuntime;
export declare function getInstrumentationRuntime(): InstrumentationRuntime | undefined;
