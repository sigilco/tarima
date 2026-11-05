import { type InstrumentationProviderDefinition } from "#instrumentation/lifecycle.js";
import { type InstrumentationRuntime } from "#instrumentation/runtime.js";
import type { CollectedOtel, RuntimeContextResolver } from "#tracing/eve/otel-declaration.js";
/**
 * Installs the process instrumentation runtime around a collected pipeline.
 *
 * `eve dev`'s zero-config default and an authored `agent/instrumentation/`
 * directory differ only in where the declared values came from.
 *
 * A directory that declared no OpenTelemetry still gets a bus: its providers
 * see every event, they just have no spans to hang them on.
 */
export declare function installInstrumentationRuntime(input: {
    readonly collected: CollectedOtel;
    readonly frameworkVersion: string;
    readonly providers: readonly InstrumentationProviderDefinition[];
    readonly runtimeContextResolvers?: readonly RuntimeContextResolver[];
    readonly serviceName: string;
}): InstrumentationRuntime;
