import { type Context as OtelContext, type TracerProvider } from "#compiled/@opentelemetry/api/index.js";
import { AgentSpanIdGenerator } from "./otel-ids.js";
import type { Attributes, AgentTelemetry, OutputMapping, ActiveOperation } from "../core/types.js";
type Context = OtelContext;
export declare function withErrorContent<T extends {
    setValue(key: symbol, value: unknown): T;
}>(context: T, allowed: boolean): T;
export declare function activeTraceOperation(host?: Pick<Context, "getValue">): ActiveOperation | undefined;
export interface OtelTelemetryOptions {
    /** Defaults to the global tracer provider. */
    readonly provider?: TracerProvider;
    /**
     * Generator installed on `provider`. Required for durable tracing so a span
     * started in a later process carries the ID its children already reference.
     */
    readonly idGenerator?: AgentSpanIdGenerator;
    /** Defaults to recording every trace. */
    readonly samplesTrace?: (traceId: string, operation: {
        name: string;
        attributes: Attributes;
    }) => boolean;
    /** Replaces the default mapping, which adds `vercel.session_id` on Vercel. */
    readonly mapping?: OutputMapping;
    readonly tracerName?: string;
    /** Recorded as the spans' instrumentation scope version. */
    readonly tracerVersion?: string;
    /** Override the provider's lifecycle, for example to flush metric readers too. */
    readonly forceFlush?: () => Promise<void>;
    readonly shutdown?: () => Promise<void>;
}
/** OpenTelemetry implementation of {@link AgentTelemetry}. */
export declare function otelTelemetry(options?: OtelTelemetryOptions): AgentTelemetry;
export {};
