/**
 * Version of the protocol a parent deployment speaks with a remote agent's
 * deployment. A create-session request that delegates work names the caller's
 * version, and the receiver's response names its own. Deployments from before
 * the version existed speak 1.
 */
export declare const REMOTE_AGENT_PROTOCOL_VERSION = 3;
/**
 * Error code a parent's callback route answers when nothing waits on the callback's token: the
 * parent already took the result, or stopped waiting. Its message is the same in every protocol.
 */
export declare const REMOTE_CALLBACK_NOT_PENDING = "CALLBACK_NOT_PENDING";
export declare const REMOTE_CALLBACK_NOT_PENDING_MESSAGE = "Session callback not pending.";
/** Error code a receiver answers when the caller speaks another protocol version. */
export declare const REMOTE_AGENT_PROTOCOL_MISMATCH = "REMOTE_AGENT_PROTOCOL_MISMATCH";
/** Protocol of eve 0.66–0.68, which sent no version. */
export declare const UNVERSIONED_REMOTE_AGENT_PROTOCOL = 1;
/**
 * Protocol of eve before v27 sessions. Its children relay people's input as v26 requests and take
 * answers as v26 `inputResponses`, which this deployment translates both ways.
 */
export declare const V26_INPUT_REMOTE_AGENT_PROTOCOL = 2;
/** The callback URL for a child that speaks `version`. */
export declare function callbackUrlForProtocol(url: string, version: number): string;
/** The protocol a callback URL says its parent agreed with the child, if it names one. */
export declare function readCallbackProtocol(url: string): number | undefined;
/**
 * Whether a remote agent serves a caller on this protocol version. It serves versions 2 and up,
 * but relays requests and streams only to a caller on its own version.
 */
export declare function servesRemoteAgentCaller(version: number): boolean;
/** Why a session can't ask its caller for input: the caller speaks an earlier protocol. */
export declare function formatEarlierRemoteCallerInputError(callerVersion: number): string;
/** Why a parent can't proxy a remote child's stream: the child speaks an earlier protocol. */
export declare function formatEarlierRemoteChildStreamError(input: {
    readonly name: string;
    readonly childVersion: number;
}): string;
/** Reads a peer's protocol version, treating an absent one as the unversioned protocol. */
export declare function readRemoteAgentProtocolVersion(value: unknown): number;
/** The caller's message when a remote agent's deployment speaks another version. */
export declare function formatRemoteAgentProtocolMismatch(input: {
    readonly name: string;
    readonly receiverVersion: number;
}): string;
