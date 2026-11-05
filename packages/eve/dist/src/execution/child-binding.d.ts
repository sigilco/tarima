import type { JsonValue } from "#shared/json.js";
/** What the parent's proxy route needs to reach one remote child's stream. */
export interface RemoteChildBinding {
    readonly callId: string;
    readonly childSessionId: string;
    readonly name: string;
    /** The proxy route the parent's `child.opened` names. */
    readonly streamPath: string;
    readonly url: string;
    readonly resolverId?: string;
    /** A dynamic remote agent's binding, which the child's credentials are built from again. */
    readonly dynamicBinding?: JsonValue;
    /** The child's remote agent protocol, when it speaks an earlier one: the proxy can't follow it. */
    readonly earlierProtocol?: number;
}
/** Records a remote child's binding on the parent session's stream, before its `child.opened`. */
export declare function recordRemoteChildBinding(parentSessionId: string, binding: RemoteChildBinding): Promise<void>;
/** Reads a remote child's binding from its parent session, or `undefined` when none was recorded. */
export declare function readRemoteChildBinding(parentSessionId: string, childSessionId: string): Promise<RemoteChildBinding | undefined>;
