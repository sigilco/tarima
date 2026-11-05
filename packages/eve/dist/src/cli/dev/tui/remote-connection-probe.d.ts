import { type Client } from "#client/index.js";
import type { RemoteConnectionState } from "./remote-connection-types.js";
type RemoteProbeResult = Extract<RemoteConnectionState, {
    state: "ready" | "auth-required" | "unavailable";
}>;
type RemoteProbePhase = "connection-check" | "authentication-verification";
export declare function classifyRemoteError(error: unknown, phase: RemoteProbePhase): RemoteProbeResult;
export declare function probeRemoteInfo(input: {
    readonly client: Client;
    readonly phase: RemoteProbePhase;
}): Promise<RemoteProbeResult>;
export {};
