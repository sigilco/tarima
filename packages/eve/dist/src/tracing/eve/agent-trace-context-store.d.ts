import type { ContextAccessor } from "#context/key.js";
import { type SessionTraceSeed } from "#context/keys.js";
import type { AgentTraceStateStore, AgentTraceValues } from "#tracing/eve/agent-trace-state.js";
import type { SessionStateMap } from "#harness/types.js";
import type { InstrumentationDecision } from "#shared/instrumentation-decision.js";
export declare const AGENT_TRACE_CONTEXT_KEY = "eve.harness.agentTrace";
export declare function currentTraceSessionId(runId: string): string | undefined;
/** Run after task-provider commits, so a pending workflow tool call keeps its anchor. */
export declare function pruneAgentTraceState(context: ContextAccessor, sessionId: string, sessionState: SessionStateMap | undefined): void;
export declare function readSessionTraceDecision(context: ContextAccessor, sessionId: string): InstrumentationDecision | undefined;
/** Keeps only framework trace state from an interrupted step's context changes. */
export declare function preserveSerializedAgentTraceState(original: Record<string, unknown>, interrupted: Record<string, unknown>): Record<string, unknown>;
/** Reads the active turn context straight out of a serialized Workflow context. */
export declare function readTurnTraceContext(serializedContext: Readonly<Record<string, unknown>>, sessionId: string, turnId: string): SessionTraceSeed | undefined;
/** Reads the durable action span that should parent a dispatched child agent. */
export declare function readActionTraceContext(serializedContext: Readonly<Record<string, unknown>>, sessionId: string, turnId: string, callId: string): SessionTraceSeed | undefined;
/** Durable trace state backed by eve's serialized Workflow context. */
export declare class ContextAgentTraceStateStore implements AgentTraceStateStore {
    get<K extends keyof AgentTraceValues>(kind: K, key: string): AgentTraceValues[K] | undefined;
    set<K extends keyof AgentTraceValues>(kind: K, key: string, value: AgentTraceValues[K]): void;
    delete(kind: keyof AgentTraceValues, key: string): void;
    update<K extends keyof AgentTraceValues>(kind: K, key: string, update: (value: AgentTraceValues[K]) => AgentTraceValues[K]): void;
    entries<K extends keyof AgentTraceValues>(kind: K): [string, AgentTraceValues[K]][];
}
