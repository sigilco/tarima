import { type SubagentParentContext } from "#subagents/invocation.js";
import type { ChannelInstrumentationProjection, SessionAuthContext, SessionCapabilities, RunInput } from "#channel/types.js";
import type { HarnessSession } from "#harness/types.js";
import type { RuntimeSubagentDispatchRequest } from "#shared/action-types.js";
import type { ConversationContext } from "#shared/conversation-context.js";
export type SubagentInputSource = {
    readonly description: string;
    readonly type: "local";
} | {
    readonly type: "runtime";
};
/**
 * Result of {@link buildSubagentRunInput}.
 *
 * Exposes the derived `childContinuationToken` alongside the
 * {@link RunInput} so dispatch sites never re-derive the token from
 * `(callId, parentSessionId)` on their own.
 */
interface SubagentRunInputBuild {
    readonly childContinuationToken: string;
    readonly runInput: RunInput;
}
/**
 * Runtime graph shape needed to answer sandbox-inheritance questions for
 * one declared child node. Partial test bundles may omit the graph.
 */
export interface SubagentSandboxGraph {
    readonly nodesByNodeId: ReadonlyMap<string, {
        readonly sandboxRegistry: {
            readonly sandbox: {
                readonly definition: {
                    readonly kind: "independent" | "parent";
                };
            } | null;
        };
    }>;
}
/**
 * Builds the {@link RunInput} for one delegated subagent child run.
 */
export declare function buildSubagentRunInput(input: {
    readonly action: RuntimeSubagentDispatchRequest;
    readonly auth: SessionAuthContext | null;
    /**
     * Parent's session capabilities. Forwarded verbatim so HITL
     * readiness flows transparently down through a subagent chain. Undefined
     * parent capabilities produce an undefined child capability set.
     */
    readonly capabilities?: SessionCapabilities;
    readonly schedule?: import("#context/session-schedule.js").SessionSchedule;
    readonly channelMetadata?: ChannelInstrumentationProjection;
    /** Replay-stable key the child's continuation token derives from. */
    readonly continuationKey: string;
    /** Parent's immutable conversation classification. */
    readonly inheritedConversation?: ConversationContext;
    readonly initiatorAuth: SessionAuthContext | null;
    /**
     * Runtime graph used to detect whether this declared child selected the
     * dispatching parent's sandbox. Absence means no inheritance.
     */
    readonly graph?: SubagentSandboxGraph;
    /** Durable session identity of the sandbox currently used by the parent. */
    readonly sandboxSessionId?: string;
    readonly selfAgent: boolean;
    readonly parent: SubagentParentContext;
    readonly session: Pick<HarnessSession, "continuationToken" | "sandboxState" | "sessionId">;
    readonly source: SubagentInputSource;
}): SubagentRunInputBuild;
export {};
