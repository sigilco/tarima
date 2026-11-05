import type { MessageContent } from "#shared/message-content.js";
import { type ResetResponse } from "#protocol/reset-session.js";
import type { CancelTurnResult, SessionAuthContext, SessionCapabilities } from "#channel/types.js";
import type { ChannelAudience } from "#shared/channel-audience.js";
import { type SubagentParentContext } from "#subagents/invocation.js";
import type { HarnessSession } from "#harness/types.js";
import type { RuntimeRemoteAgentDispatchRequest } from "#shared/action-types.js";
import type { RuntimeSubagentRegistry } from "#runtime/subagents/registry.js";
import type { DynamicRemoteAgentConfig, RemoteAgentCredentials } from "#runtime/subagents/dynamic-remote-agent-config.js";
import type { DynamicRemoteBinding } from "#definitions/remote.js";
import type { JsonValue } from "#shared/json.js";
import type { CompiledRuntimeAgentBundle } from "#runtime/sessions/compiled-agent-cache.js";
import type { RemoteAgentBinding } from "#eve-channel/support.js";
import type { Answer } from "#shared/input.js";
import type { ResolvedRuntimeRemoteAgentNode } from "#runtime/types.js";
import type { JsonObject } from "#shared/json.js";
type RemoteAgentSessionCoordinates = {
    readonly sessionId: string;
    /** The first message's delivery, which earlier-protocol receivers don't name. */
    readonly deliveryId?: string;
    /** The child's protocol, when it speaks an earlier one: its result arrives, nothing else. */
    readonly earlierProtocol?: number;
};
export declare function startRemoteAgentSession(input: {
    readonly action: RuntimeRemoteAgentDispatchRequest;
    /** The dispatching turn's session principal, forwarded when `remote.forwardPrincipal` is set. */
    readonly auth?: SessionAuthContext | null;
    readonly callbackBaseUrl: string | undefined;
    readonly capabilities?: SessionCapabilities;
    readonly originAudience?: ChannelAudience;
    /** The root initiator's principal, forwarded alongside {@link auth}. */
    readonly initiatorAuth?: SessionAuthContext | null;
    /**
     * Replay-stable identity of this create attempt. A retried dispatch step
     * re-sends the same value, letting the receiver return the child it already
     * created instead of starting a second one.
     */
    readonly operationId?: string;
    readonly parent?: Omit<SubagentParentContext, "lineage"> & {
        readonly lineage?: SubagentParentContext["lineage"];
    };
    readonly remote: ResolvedRuntimeRemoteAgentNode;
    readonly session: Pick<HarnessSession, "continuationToken">;
}): Promise<RemoteAgentSessionCoordinates>;
export declare function respondToRemoteAgentSession(input: {
    readonly remote: RemoteAgentBinding & {
        readonly sessionId: string;
    };
    readonly headers: Record<string, string>;
    readonly auth: SessionAuthContext | null | undefined;
    /**
     * Names this set of answers, so a retried step's repeat is the same delivery to the child.
     * Only a child on this protocol accepts it.
     */
    readonly idempotencyKey?: string;
    readonly responses: readonly Answer[];
}): Promise<void>;
/** Continues one remote-agent session by its immutable session ID. */
export declare function continueRemoteAgentSession(input: {
    /** The dispatching turn's session principal, forwarded when `remote.forwardPrincipal` is set. */
    readonly auth: SessionAuthContext | null;
    readonly callback: {
        readonly callId: string;
        readonly subagentName: string;
        readonly token: string;
        readonly url: string;
    };
    readonly earlierProtocol?: number;
    /**
     * Names this message, so a retried step's repeat is the same delivery and returns the same
     * receipt. Only a child on this protocol accepts it.
     */
    readonly idempotencyKey?: string;
    readonly message: MessageContent<string | URL>;
    readonly outputSchema?: JsonObject;
    readonly remote: ResolvedRuntimeRemoteAgentNode;
    readonly sessionId: string;
}): Promise<{
    readonly sessionId: string;
    readonly deliveryId?: string;
}>;
export declare function cancelRemoteAgentTurn(input: {
    readonly remote: Pick<ResolvedRuntimeRemoteAgentNode, "auth" | "headers" | "name" | "url">;
    readonly sessionId: string;
}): Promise<CancelTurnResult>;
/** Retires one exact remote child session through eve's authenticated reset route. */
export declare function resetRemoteAgentSession(input: {
    readonly reason: string;
    readonly remote: Pick<ResolvedRuntimeRemoteAgentNode, "auth" | "headers" | "name" | "url">;
    readonly sessionId: string;
}): Promise<ResetResponse>;
export declare function resolveRemoteAgentForAction(input: {
    readonly dynamicRemoteAgent?: DynamicRemoteAgentConfig;
    /** A dynamic remote agent's credentials, built again from its child's binding. */
    readonly credentials?: RemoteAgentCredentials;
    readonly nodeId: string;
    readonly registry: RuntimeSubagentRegistry["subagentsByNodeId"];
    readonly remoteAgentName: string;
}): ResolvedRuntimeRemoteAgentNode;
/**
 * Resolves authored outbound headers for a server-authored remote child event.
 *
 * `resolverId` is the key the parent's private child binding records: the subagent's node id,
 * never resolved credentials. A static remote agent's definition must still agree with the
 * event's `name`/`url`, and a dynamic one's credentials are built again from the binding the
 * child was opened with, for the same destination, so a stale or mismatched key fails closed
 * rather than minting headers for the wrong upstream.
 */
export declare function resolveRemoteAgentStreamHeaders(input: {
    readonly bundle: CompiledRuntimeAgentBundle;
    readonly name: string;
    readonly resolverId?: string;
    readonly url: string;
    /** A dynamic remote agent's binding, from the parent's binding for the child. */
    readonly dynamicBinding?: JsonValue | DynamicRemoteBinding;
}): Promise<Record<string, string>>;
export {};
