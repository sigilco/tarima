import type { DeliverHookPayload } from "#channel/types.js";
import type { TelemetryOptions } from "ai";
import type { InstrumentationScope, InstrumentationContextRunner, InstrumentationHooks, InstrumentationSessionStartedEvent, InstrumentationTraceContext, InstrumentationTraceSeed, InstrumentationTurnStartedEvent } from "#instrumentation/lifecycle.js";
import { type BuildTelemetryRuntimeContextInput } from "#instrumentation/runtime-context.js";
import { type AttemptPlace, type CreateInstrumentationHandleEventInput } from "#instrumentation/native-events.js";
import type { HandleEventFn } from "#harness/types.js";
import { type PrepareTurnTraceContextInput } from "#instrumentation/prepare-trace-context.js";
import type { TraceContext } from "#protocol/session-events/families/session.js";
import type { OtelHarnessSettings, RuntimeContextResolver } from "#tracing/eve/otel-declaration.js";
import { AgentSpanIdGenerator } from "#compiled/@vercel/agent-runs/index.js";
import { type ContextContainer } from "#context/container.js";
import { type MemoryInstrumentation } from "#instrumentation/memory.js";
import type { SamplingOperation as AgentSamplingOperation } from "#tracing/eve/otel-registration.js";
import { getInstrumentationRuntime, registerInstrumentationRuntime } from "#instrumentation/runtime-global.js";
import { initializeSessionInstrumentation } from "#instrumentation/session-init.js";
export { getInstrumentationRuntime, registerInstrumentationRuntime };
export { initializeSessionInstrumentation };
interface InstrumentedStepSession {
    readonly sessionId: string;
    readonly state?: Readonly<Record<string, unknown>>;
}
export interface InstrumentationStepScope<TSession> {
    readonly gatewayTraceContextHeaders?: () => Record<string, string> | undefined;
    readonly createHandleEvent: (input: Omit<CreateInstrumentationHandleEventInput, "agentName" | "channelAudience" | "channelKind" | "hooks" | "parentLineage" | "parentTraceContext" | "rootSessionId" | "traceSessionId" | "sessionId">) => HandleEventFn | undefined;
    /** The AI SDK telemetry for one attempt; the attempt's start and end come from its facts. */
    readonly prepareAttempt: (input: AttemptPlace & {
        readonly isFrameworkTool?: (name: string) => boolean;
        readonly runtimeContext?: Readonly<Record<string, unknown>>;
    }) => PreparedInstrumentationAttempt;
    readonly preparePreamble: (input: Omit<PrepareTurnTraceContextInput, "instrumentation" | "principals" | "session">) => Promise<TraceContext | undefined>;
    readonly recordError: (error: unknown) => void;
    readonly resolveRuntimeContext: (input: Omit<BuildTelemetryRuntimeContextInput, "capturesContent" | "context" | "providerResolvers">) => Record<string, unknown> | undefined;
    readonly session: TSession;
    readonly setTurnId: (turnId: string) => void;
    readonly telemetry: () => TelemetryOptions | undefined;
    readonly traceContext?: InstrumentationTraceContext;
}
export interface PreparedInstrumentationAttempt {
    readonly scope: InstrumentationScope;
    readonly telemetry: TelemetryOptions | undefined;
}
export interface BoundInstrumentationSession {
    readonly traceSessionId: string;
    readonly agentName: string;
    readonly rootSessionId: string;
    readonly sessionId: string;
}
/** Process-wide runtime consumed by every harness execution surface. */
export interface InstrumentationRuntime {
    readonly forceFlush: () => Promise<void>;
    readonly hooks: InstrumentationHooks;
    readonly idGenerator?: AgentSpanIdGenerator;
    readonly memoryOperations?: boolean;
    readonly ownsAgentSpans?: boolean;
    readonly prepareSessionTrace?: (event: InstrumentationSessionStartedEvent) => Promise<InstrumentationTraceSeed>;
    readonly prepareTurnTrace?: (event: InstrumentationTurnStartedEvent) => Promise<InstrumentationTraceSeed>;
    otelSettings: OtelHarnessSettings | undefined;
    readonly runtimeContextResolvers?: readonly RuntimeContextResolver[];
    readonly runInContext: InstrumentationContextRunner;
    /** Whether the installed OTel sampler would record a trace with this id. */
    readonly samplesTrace?: (traceId: string, operation?: AgentSamplingOperation) => boolean;
    readonly shutdown: () => Promise<void>;
}
/** Worker-bound instrumentation operations consumed by one session execution. */
export interface SessionInstrumentation {
    readonly installAiSdkWarningLogger: () => void;
    readonly runStep: <TSession extends InstrumentedStepSession, TResult>(input: {
        readonly environment: string;
        readonly eveVersion: string;
        readonly hasInput: boolean;
        readonly session: TSession;
    }, execute: (scope: InstrumentationStepScope<TSession>) => Promise<TResult>) => Promise<TResult>;
}
export interface ExecutionInstrumentation {
    readonly prepareDelivery: (delivery: DeliverHookPayload) => void;
    readonly createHandleEvent: (input: {
        readonly handleEvent?: HandleEventFn;
    }) => HandleEventFn | undefined;
    readonly flush: () => Promise<void>;
    readonly memory?: MemoryInstrumentation;
    readonly prepareExecution: () => SessionInstrumentation;
    readonly preparePreamble: InstrumentationStepScope<never>["preparePreamble"];
}
export declare function bindInstrumentationRuntime(runtime: InstrumentationRuntime | undefined, ctx: ContextContainer, boundInput: Omit<BoundInstrumentationSession, "traceSessionId">): ExecutionInstrumentation | undefined;
export declare function bindSessionInstrumentation(input: {
    readonly agentName: string;
    readonly ctx: ContextContainer;
    readonly rootSessionId: string;
    readonly sessionId: string;
}): ExecutionInstrumentation | undefined;
