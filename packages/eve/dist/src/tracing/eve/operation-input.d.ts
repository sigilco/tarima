import type { AgentTraceStateStore } from "#tracing/eve/agent-trace-state.js";
import { type AgentTelemetry, type AgentRun } from "#compiled/@vercel/agent-runs/index.js";
export declare function checkpointContent(value: string | undefined): unknown;
/** Identity of one eve turn within the shared tracing library. */
export declare function eveTurnIdentity(input: {
    readonly sessionId: string;
    readonly rootSessionId?: string;
    readonly turnId: string;
}): {
    conversationId: string;
    runId: string;
    turnId: string;
};
/** eve's agent tracing, checkpointed in its workflow-context trace state. */
export declare function createEveTracing(input: {
    readonly telemetry: AgentTelemetry;
    readonly stateStore: AgentTraceStateStore;
}): AgentRun;
