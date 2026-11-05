import { type Context, type SpanContext } from "#compiled/@opentelemetry/api/index.js";
import type { InstrumentationScope, InstrumentationExecutionOperation, InstrumentationCallRequestedEvent, InstrumentationCallSettledEvent } from "#instrumentation/lifecycle.js";
import type { AgentActionTraceState, AgentTraceStateStore } from "#tracing/eve/agent-trace-state.js";
import type { AgentRun, AttemptOperation, CaptureDecision, ToolOperation } from "#compiled/@vercel/agent-runs/index.js";
export interface AgentToolContext {
    readonly context: Context;
    readonly spanContext: SpanContext;
}
type ToolExecution = Extract<InstrumentationExecutionOperation, {
    type: "tool.call";
}>;
/** Finds an open tool call in its turn's trace tree, in this or a later process. */
export declare function resumeTool(tracing: AgentRun, state: AgentActionTraceState): Promise<ToolOperation | undefined>;
/**
 * One `execute_tool` span per call. eve's tool loop reports the durable
 * dispatch through `tool.call.*` events; the SDK reports the run through the
 * execution context. Both name the same call ID, so they share one span. A run
 * without a dispatch closes under its step when the step ends.
 */
export declare function createAgentToolInstrumentation(input: {
    readonly tracing: AgentRun;
    readonly attemptFor: (scope: InstrumentationScope) => Promise<AttemptOperation | undefined>;
    readonly stepFor: (scope: InstrumentationScope) => AttemptOperation | undefined;
    readonly recordInputs: boolean;
    readonly recordOutputs: boolean;
    readonly stateStore: AgentTraceStateStore;
}): {
    stateFor: (sessionId: string, turnId: string, callId: string) => Promise<AgentActionTraceState | undefined>;
    contextFor(sessionId: string, turnId: string, callId: string): Promise<AgentToolContext | undefined>;
    deleteForSession(sessionId: string): Promise<void>;
    forgetAttempt(scope: InstrumentationScope): Promise<void>;
    /** Closes SDK runs that no dispatch claimed before their step ended. */
    drain(attemptId: string, failure?: {
        readonly error: unknown;
    }): Promise<void>;
    /** Runs the SDK's tool call inside its span, or calls `fallback` when it has none. */
    runInContext<T>(operation: ToolExecution, execute: () => PromiseLike<T>, ceiling: CaptureDecision, fallback: () => Promise<T>): Promise<T>;
    events: {
        "call.requested": (event: InstrumentationCallRequestedEvent) => Promise<void>;
        "call.settled": (event: InstrumentationCallSettledEvent) => Promise<void>;
    };
};
export {};
