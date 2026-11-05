import type { Context } from "#compiled/@opentelemetry/api/index.js";
import { type InstrumentationSessionStartedEvent, type InstrumentationTraceSeed, type InstrumentationTurnStartedEvent, type InstrumentationTurnSettledEvent, type InstrumentationSessionEndedEvent } from "#instrumentation/lifecycle.js";
import type { TraceCapturePolicy } from "#tracing/eve/otel-declaration.js";
import type { AgentSessionTraceState, AgentTraceStateStore } from "#tracing/eve/agent-trace-state.js";
import type { createEveCapturePolicy } from "#tracing/eve/policy.js";
import type { ConversationEnvironment } from "#shared/conversation-context.js";
import type { AgentSpanIdGenerator, AgentRun, TurnOperation } from "#compiled/@vercel/agent-runs/index.js";
interface EveSessionTracingInput {
    readonly tracing: AgentRun;
    readonly idGenerator: AgentSpanIdGenerator;
    readonly environment: ConversationEnvironment;
    readonly frameworkVersion: string;
    readonly stateStore: AgentTraceStateStore;
    readonly tracePolicy?: TraceCapturePolicy;
    readonly capturePolicy: ReturnType<typeof createEveCapturePolicy>;
}
type SessionMetadata = Omit<InstrumentationSessionStartedEvent, "idempotencyKey" | "type">;
interface EveSessionTracing {
    readonly ensureSessionContext: (event: SessionMetadata) => Promise<AgentSessionTraceState>;
    readonly prepareSessionTrace: (event: InstrumentationSessionStartedEvent) => Promise<InstrumentationTraceSeed>;
    readonly prepareTurnTrace: (event: InstrumentationTurnStartedEvent) => Promise<InstrumentationTraceSeed>;
    /** Hydrates a turn this process or an earlier one started. */
    turnFor(sessionId: string, turnId: string, context?: Context): Promise<TurnOperation | undefined>;
    /** Whether the trace policy dropped this turn, so its work must not record spans. */
    dropped(sessionId: string, turnId: string): Promise<boolean>;
    turnSettled(event: InstrumentationTurnSettledEvent): Promise<void>;
    /** Ends a turn the session's end left open, failed when the session failed. */
    sessionEnded(event: InstrumentationSessionEndedEvent): Promise<void>;
}
export declare function createEveSessionTracing(input: EveSessionTracingInput): EveSessionTracing;
export {};
