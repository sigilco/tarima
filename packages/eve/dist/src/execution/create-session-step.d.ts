import { type DurableCompiledArtifactsSource } from "#runtime/durable-compiled-artifacts-source.js";
import { type DurableSessionState } from "#execution/durable-session-store.js";
import type { HarnessModelMessage } from "#harness/messages.js";
import type { JsonObject } from "#shared/json.js";
import type { AgentSessionRuntimeOverrides } from "#execution/agent-sessions/runtime-overrides.js";
import type { DynamicSubagentAgentConfig } from "#runtime/subagents/dynamic-agent-config.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
/**
 * Result returned by {@link createSessionStep}.
 *
 * Exposes the projected {@link DurableSessionState} and the history the
 * owner needs to drive the turn loop.
 */
export interface CreateSessionStepResult {
    readonly history: HarnessModelMessage[];
    readonly state: DurableSessionState;
}
/**
 * Creates the durable session and returns the initial snapshot-bearing
 * state before the workflow enters its turn loop.
 * `nodeId` targets a subagent node in the compiled graph; omitted for
 * the root agent.
 */
export declare function createSessionStep(input: {
    readonly agentSessionRuntimeOverrides?: AgentSessionRuntimeOverrides;
    readonly compiledArtifactsSource: DurableCompiledArtifactsSource;
    readonly continuationToken: string;
    readonly dynamicSubagentAgentConfig?: DynamicSubagentAgentConfig;
    /** History from `create()`, held until the first message's turn adds it. */
    readonly history?: readonly SessionHistoryMessage[];
    readonly outputSchema?: JsonObject;
    readonly nodeId?: string;
    readonly rootSessionId?: string;
    readonly sessionId: string;
}): Promise<CreateSessionStepResult>;
