import type { StubCall, StubScope } from "#tool-stubs/types.js";
export type StubRequest = {
    readonly kind: "call";
    readonly call: StubCall;
} | {
    readonly kind: "failure";
    readonly callId: string;
    readonly error: string;
};
/** The original workflow serves stub requests even if a newer deployment takes over the session. */
export declare function withStubPlayback<T>(scope: StubScope | undefined, sessionId: string, run: () => Promise<T>): Promise<T>;
