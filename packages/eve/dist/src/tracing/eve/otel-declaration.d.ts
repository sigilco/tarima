import { type InstrumentationProvider } from "#instrumentation/provider.js";
import type { InstrumentationModelStartedInput } from "#public/instrumentation/index.js";
import type { JsonObject } from "#shared/json.js";
import type { MetricReader, SpanExporter, SpanProcessor, OtelConfiguration, PropagatorOrName as PropagatorSetting, SamplerOrName as SamplerSetting, SpanProcessorOrName as SpanProcessorSetting } from "#tracing/eve/otel-configuration.js";
import type { TraceCapturePolicy } from "#shared/trace-policy.js";
export type { TraceCaptureContext, TraceCapturePolicy, TracePolicyDecision, } from "#shared/trace-policy.js";
import type { SpanExportPolicy } from "#tracing/eve/span-export-policy.js";
export type { SpanAttributeDecision, SpanExportAttributeValue, SpanExportContext, SpanExportDecision, SpanExportPolicy, } from "#tracing/eve/span-export-policy.js";
/**
 * The process-wide OpenTelemetry settings, declared by `otel()`.
 *
 * Everything here is a singleton, which is why it is one file: a process has
 * one tracer provider, so it has one resource, one sampler, and one propagator
 * set. Destinations are the plural half and live in `otelIntegration()`.
 *
 * `contextManager` is deliberately absent: eve's span nesting depends on it.
 */
export interface OtelOptions {
    /**
     * The function identifier attached to telemetry spans
     * (`ai.telemetry.functionId`). Defaults to the agent name.
     */
    readonly functionId?: string;
    /**
     * Whether to emit an eve-owned HTTP `SERVER` span around each channel
     * request. For a one-to-one delivery, the activation remains a separate
     * trace root and links to this span; when disabled, it links to any
     * already-active upstream request or function span instead. Defaults to
     * `false`.
     */
    readonly traceChannelRequests?: boolean;
    /**
     * Process-wide trace and content decision. Boolean returns preserve the
     * existing audience-aware behavior; explicit decisions can disable emission
     * or select input and output capture independently for any audience.
     * Defaults to emitting every audience, with content only for public
     * conversations or development. Explicit content decisions override defaults
     * for the evaluated audience, but destination settings can only narrow them.
     * For a trusted remote trace, eve evaluates this policy against the immutable
     * origin audience and intersects it with the parent's effective ceiling, so every
     * hop can only narrow capture. It never changes what lifecycle instrumentation
     * receives. A thrown error rejects trace production without silencing
     * lifecycle providers. The policy may be invoked more than once
     * while a new session is being prepared, so it must be deterministic for
     * consistent results.
     * Unless `experimental.workflow.retention` is explicit, the session's
     * resolved decision also selects Workflow retention: both content directions
     * use the World's default; dropped traces or either excluded direction
     * request deletion on completion. This also removes completed transcripts,
     * but does not delete exported traces.
     */
    readonly tracePolicy?: TraceCapturePolicy;
    /**
     * Resource attributes merged into eve's own, which already carry the
     * service name.
     */
    readonly resource?: Readonly<Record<string, unknown>>;
    /**
     * Head sampling, and it is global: it decides whether a span is created at
     * all, so it thins eve's own sinks and the `traceparent` eve propagates
     * along with your exporters. To thin one backend only, drop spans in a
     * processor.
     */
    readonly sampler?: SamplerSetting;
    /** Composed into one propagator. All inject; the first to extract wins. Defaults to `auto`. */
    readonly propagators?: readonly PropagatorSetting[];
    /**
     * OpenTelemetry `Instrumentation` instances passed through to
     * `registerOTel` before the server entry loads. Disabled by default.
     * Keep packages that rely on Node.js module hooks in
     * `build.externalDependencies` and out of instrumentation modules' import
     * graphs so they load after registration.
     */
    readonly instrumentations?: readonly unknown[];
}
export interface ManagedTraceOptions {
    /** One destination policy, or policies applied in declaration order before export. */
    readonly exportPolicy?: SpanExportPolicy | readonly SpanExportPolicy[];
}
/** Where one `otelIntegration()` sends spans and metrics. */
export interface OtelIntegrationOptions extends ManagedTraceOptions {
    /** Merged into the pipeline in declaration order. */
    readonly spanProcessors?: readonly SpanProcessor[];
    /** Wrapped in eve's batching processor and appended after `spanProcessors`. */
    readonly traceExporter?: SpanExporter;
    /**
     * Metric readers collected into the process's one meter provider in
     * declaration order. Without any, the meter provider is not created and
     * `metrics.getMeter()` returns a no-op meter. Readers come from the app's
     * own `@opentelemetry/sdk-metrics` install.
     */
    readonly metricReaders?: readonly MetricReader[];
    /**
     * Contributes runtime context that the AI SDK merges into telemetry spans
     * for each model call. Child spans inherit the values, so a destination can
     * stamp channel or auth identity onto every span in the turn.
     *
     * Synchronous: the harness collects from every destination before the model
     * call, so a return that is not a plain object is dropped (warning-only).
     * Keys beginning with `eve.` are reserved and dropped. Return `undefined`
     * to contribute nothing.
     */
    readonly runtimeContext?: (input: InstrumentationModelStartedInput) => JsonObject | undefined;
}
declare const OTEL_DECLARATION: unique symbol;
declare const OTEL_INTEGRATION: unique symbol;
/**
 * The declared OpenTelemetry pipeline settings. eve collects this before
 * building the tracer provider, so it is a value rather than a side effect.
 */
export interface OtelDeclaration extends InstrumentationProvider {
    readonly [OTEL_DECLARATION]: true;
    readonly options: OtelOptions;
}
/** One declared destination. A process may have as many as it has files. */
export interface OtelIntegration extends InstrumentationProvider {
    readonly [OTEL_INTEGRATION]: true;
    readonly metricReaders: readonly MetricReader[];
    readonly runtimeContext?: (input: InstrumentationModelStartedInput) => JsonObject | undefined;
    readonly spanProcessors: readonly SpanProcessorSetting[];
}
/**
 * Declares the process-wide OpenTelemetry settings.
 *
 * Export it from `agent/instrumentation/otel.ts`. Omitting the file is the
 * common case: eve registers the pipeline for whatever destinations are
 * declared beside it, and this only names what those destinations share.
 */
export declare function otel(options?: OtelOptions): OtelDeclaration;
/**
 * Declares one destination for this agent's traces.
 *
 * A `traceExporter` is wrapped in eve's batching processor, which is what makes
 * the one-line form of a hosted backend enough. Pass `spanProcessors` instead
 * when the destination needs its own batching, sampling, or filtering.
 *
 * The export policy wraps every processor here, an author's included: they are
 * this destination, and nothing beneath the policy sees what it removes.
 */
export declare function otelIntegration(options?: OtelIntegrationOptions): OtelIntegration;
export declare function isOtelDeclaration(value: unknown): value is OtelDeclaration;
export declare function isOtelIntegration(value: unknown): value is OtelIntegration;
/** What the harness reads at turn time, as opposed to at registration. */
export interface OtelHarnessSettings {
    readonly functionId?: string;
    readonly traceChannelRequests: boolean;
    readonly tracePolicy?: TraceCapturePolicy;
    /** Whether AI SDK spans include model and tool inputs. */
    readonly recordInputs: boolean;
    /** Whether AI SDK spans include model and tool outputs. */
    readonly recordOutputs: boolean;
}
/**
 * A tracing destination's `runtimeContext` for one model attempt; `undefined` adds nothing.
 * Later destinations win on key collisions.
 */
export type RuntimeContextResolver = (input: InstrumentationModelStartedInput) => JsonObject | undefined;
/** The one pipeline a process can register. */
export interface CollectedOtel {
    /**
     * Whether anything declared OpenTelemetry. False means eve should leave the
     * global tracer provider slot alone rather than register an empty pipeline.
     */
    readonly declared: boolean;
    readonly configuration: OtelConfiguration;
    readonly runtimeContextResolvers: readonly RuntimeContextResolver[];
    readonly settings: OtelHarnessSettings;
}
