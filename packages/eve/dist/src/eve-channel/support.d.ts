import type { JsonValue } from "#shared/json.js";
import type { MessageContent } from "#shared/message-content.js";
import type { DeliveryReceipt } from "#protocol/delivery.js";
import type { SessionAuthContext } from "#channel/types.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
import { type ClientContextValue, type EveChannelConfig, type EveHandle } from "#eve-channel/types.js";
export declare function healthResponse(): Response;
/** Clients display the error text directly; keep operator details in structured fields. */
export declare function sessionCommandErrorResponse(error: unknown): Response | undefined;
export declare function deliveryResponse(receipt: DeliveryReceipt): Response;
/** Where a remote child the parent session recorded runs, and its credential key. */
export interface RemoteAgentBinding {
    readonly forwardPrincipal?: boolean;
    readonly name: string;
    readonly resolverId?: string;
    /**
     * A dynamic remote agent's binding: what its credentials are built from again. Private: only
     * the parent session's own state and steps carry it, never a request.
     */
    readonly dynamicBinding?: JsonValue;
    readonly url: string;
    /** The child's remote agent protocol, when it speaks an earlier one. */
    readonly earlierProtocol?: number;
}
interface RemoteAgentStreamCoordinates {
    readonly callId: string;
    readonly childSessionId: string;
    readonly childStreamPath: string;
}
/** Finds the remote child the parent session recorded for one proxy route, from its private binding. */
export declare function findRemoteAgentBinding(input: RemoteAgentStreamCoordinates & {
    readonly parent: {
        getChildBinding?(childSessionId: string): Promise<{
            readonly callId: string;
            readonly name: string;
            readonly resolverId?: string;
            readonly dynamicBinding?: JsonValue;
            readonly streamPath: string;
            readonly url: string;
            readonly earlierProtocol?: number;
        } | undefined>;
    };
}): Promise<RemoteAgentBinding | undefined>;
interface OnMessageOutcome {
    readonly auth: SessionAuthContext | null;
    /** Model-ready turn context: `onMessage`'s replacement, or the request's labeled entries. */
    readonly clientContext?: readonly string[];
    readonly context?: readonly string[];
    readonly history?: readonly SessionHistoryMessage[];
    readonly title?: string;
}
export declare function resolveOnMessage(input: {
    readonly auth: SessionAuthContext | null;
    readonly clientContext?: ClientContextValue;
    readonly config: EveChannelConfig;
    readonly invocation?: EveHandle["invocation"];
    readonly message: MessageContent;
    readonly request: Request;
    readonly sessionId?: string;
}): Promise<OnMessageOutcome | Response>;
/**
 * The turn's model context messages: `onMessage`'s replacement as written, otherwise
 * the request's entries labeled as client-supplied. Empty means none.
 */
export declare function resolveTurnClientContext(replacement: ClientContextValue | undefined, requested: ClientContextValue | undefined): readonly string[] | undefined;
export {};
