import { type TracerProvider } from "#compiled/@opentelemetry/api/index.js";
import { AgentSpanIdGenerator } from "#compiled/@vercel/agent-runs/index.js";
import type { OtelConfiguration } from "./otel-configuration.js";
import { type Attributes } from "#compiled/@vercel/agent-runs/index.js";
export type SamplingOperation = {
    readonly name: string;
    readonly attributes?: Attributes;
};
/**
 * Builds the process's one OpenTelemetry tracer provider from a merged
 * declaration, then proves it took the global slot.
 *
 * `registerOTel` reports a refused registration only through `diag`, which
 * goes nowhere unless `OTEL_LOG_LEVEL` is set, so a second caller would export
 * nothing and say nothing. eve primes its id generator and installs a private
 * propagator, then verifies both through the global APIs.
 */
export declare function registerOtelPipeline(input: {
    readonly otel: OtelConfiguration;
    readonly serviceName: string;
}): RegisteredOtelPipeline;
/** Lifecycle retained from the providers that own every destination. */
export interface RegisteredOtelPipeline {
    readonly provider: TracerProvider;
    readonly forceFlush: () => Promise<void>;
    readonly idGenerator: AgentSpanIdGenerator;
    /** Whether the installed sampler would record a trace with this id. */
    readonly samplesTrace: (traceId: string, operation?: SamplingOperation) => boolean;
    readonly shutdown: () => Promise<void>;
}
export declare const registerOtel: typeof registerOtelPipeline;
