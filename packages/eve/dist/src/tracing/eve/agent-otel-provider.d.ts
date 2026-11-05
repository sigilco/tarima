import type { AgentTraceStateStore } from "#tracing/eve/agent-trace-state.js";
import type { TraceCapturePolicy } from "#tracing/eve/otel-declaration.js";
import type { InstrumentationContextRunner, InstrumentationProviderDefinition, InstrumentationSessionStartedEvent, InstrumentationTraceSeed, InstrumentationTurnStartedEvent } from "#instrumentation/lifecycle.js";
import type { ConversationEnvironment } from "#shared/conversation-context.js";
import type { AgentSpanIdGenerator, AgentTelemetry } from "#compiled/@vercel/agent-runs/index.js";
export interface AgentOtelInstrumentationInput {
    /** Span output for eve's agent spans; its `ids` make turns durable across workers. */
    readonly telemetry: AgentTelemetry;
    readonly idGenerator: AgentSpanIdGenerator;
    readonly environment?: ConversationEnvironment;
    /** Whether any destination records model and tool inputs. */
    readonly recordInputs?: boolean;
    /** Whether any destination records model and tool outputs. */
    readonly recordOutputs?: boolean;
    readonly frameworkVersion: string;
    readonly stateStore: AgentTraceStateStore;
    readonly tracePolicy?: TraceCapturePolicy;
}
/** OTel event definition and its trusted framework context runner. */
interface AgentOtelInstrumentation {
    readonly hook: InstrumentationProviderDefinition;
    readonly prepareSessionTrace: (event: InstrumentationSessionStartedEvent) => Promise<InstrumentationTraceSeed>;
    readonly prepareTurnTrace: (event: InstrumentationTurnStartedEvent) => Promise<InstrumentationTraceSeed>;
    readonly runInContext: InstrumentationContextRunner;
}
/** Creates OTel instrumentation for eve's structural and GenAI spans. */
export declare function createAgentOtelInstrumentation(input: AgentOtelInstrumentationInput): AgentOtelInstrumentation;
export {};
