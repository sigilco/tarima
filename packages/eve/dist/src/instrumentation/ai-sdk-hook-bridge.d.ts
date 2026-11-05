import type { Telemetry } from "ai";
import type { InstrumentationScope, InstrumentationContextRunner, InstrumentationHooks } from "#instrumentation/lifecycle.js";
/** Creates one provider-neutral AI SDK bridge for one actual model attempt. */
export declare function createAiSdkHookBridge(scope: InstrumentationScope, hooks: InstrumentationHooks, runInContext?: InstrumentationContextRunner, runtimeContext?: Readonly<Record<string, unknown>>, isFrameworkTool?: (name: string) => boolean): Telemetry;
