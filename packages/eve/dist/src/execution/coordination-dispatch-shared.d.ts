/** Shared owner-side dispatch context preparation. */
import { type ChannelAdapter, type ChannelAdapterContext } from "#channel/adapter.js";
import type { SandboxState } from "#sandbox/state.js";
import { type LocalDevRequestProvenance } from "#context/keys.js";
import { ContextContainer } from "#context/container.js";
import { type CompiledBundle } from "#runtime/sessions/runtime-context-keys.js";
import type { HarnessSessionBase } from "#harness/types.js";
import type { RuntimeActionResult, RuntimeWorkflowTaskRequest } from "#shared/action-types.js";
import type { SessionParent, SessionTraceRoot } from "#channel/types.js";
import { type DurableSessionState, readDurableSession } from "#execution/durable-session-store.js";
import { buildSubagentRunInput } from "#subagents/tool.js";
import type { WorkflowToolRunOwner } from "#execution/tools/workflow/messages.js";
import type { DynamicSubagentSelections } from "#execution/agent-sessions/target.js";
import type { WorkflowAgentMetadata } from "#tools/workflow-definition.js";
/** Input shared by direct and Workflow-originated owner-side dispatch. */
export interface CoordinationDispatchInput {
    readonly workflowToolRunOwner: WorkflowToolRunOwner;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
}
/** Owner-side results and the updated context and session. */
export interface CoordinationDispatchResult {
    readonly results: readonly RuntimeActionResult[];
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
    /** What the dispatch leaves for the step that publishes it; the dispatch itself publishes nothing. */
    readonly pending: PendingDispatch;
}
import type { PendingDispatch } from "#harness/session-machine/transitions.js";
export type { PendingDispatch };
/** Everything preflight produces before either step's dispatch loop runs. */
export interface PreparedCoordinationDispatch<PlanEntry = RuntimeWorkflowTaskRequest> {
    readonly adapter: ChannelAdapter;
    readonly adapterCtx: ChannelAdapterContext;
    readonly auth: Parameters<typeof buildSubagentRunInput>[0]["auth"];
    readonly batch: DispatchBatch;
    readonly bundle: CompiledBundle;
    readonly capabilities: Parameters<typeof buildSubagentRunInput>[0]["capabilities"];
    readonly channelMetadata: Parameters<typeof buildSubagentRunInput>[0]["channelMetadata"];
    readonly dynamicSubagentSelections: DynamicSubagentSelections;
    readonly inheritedConversation: Parameters<typeof buildSubagentRunInput>[0]["inheritedConversation"];
    readonly initiatorAuth: Parameters<typeof buildSubagentRunInput>[0]["initiatorAuth"];
    /** Inherited originating-client metadata for the dev-TUI hint. */
    readonly localDevRequest?: LocalDevRequestProvenance;
    /** Lineage of the session running this dispatch, when it is itself a delegated child. */
    readonly parentSession: SessionParent | undefined;
    readonly sandboxSessionId: string;
    /** The state of that sandbox: this session's own, or else its owner's when it shares it. */
    readonly sandboxState?: SandboxState;
    readonly serializedContext: Record<string, unknown>;
    readonly plan: readonly PlanEntry[];
    readonly session: HarnessSessionBase;
    readonly sessionState: DurableSessionState;
    /** Trace root that this session's local children inherit, when it isn't the lineage root. */
    readonly traceRoot?: SessionTraceRoot;
    readonly workflowAgents: Readonly<Record<string, WorkflowAgentMetadata>>;
}
/**
 * Runs every dispatch precondition that may throw — durable reads, context
 * deserialization, handle-store validation, and batch planning — before any
 * run starts. Returns undefined when no actions are pending.
 */
export declare function prepareCoordinationDispatch(input: {
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
}): Promise<PreparedCoordinationDispatch | undefined>;
interface DispatchBatch {
    readonly event: {
        readonly sequence: number;
        readonly stepIndex: number;
        readonly turnId: string;
    };
    readonly requests: readonly {
        readonly callId: string;
    }[];
}
export declare function prepareActionDispatch<PlanEntry>(input: {
    readonly batch: DispatchBatch;
    readonly ctx: ContextContainer;
    readonly durableSession: Awaited<ReturnType<typeof readDurableSession>>;
    readonly plan: (input: {
        readonly bundle: CompiledBundle;
        readonly ctx: ContextContainer;
        readonly requests: DispatchBatch["requests"];
        readonly session: HarnessSessionBase;
    }) => readonly PlanEntry[];
    readonly serializedContext: Record<string, unknown>;
}): Promise<Omit<PreparedCoordinationDispatch<PlanEntry>, "sessionState">>;
