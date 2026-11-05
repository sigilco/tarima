import type { StubScope } from "#tool-stubs/types.js";
/** Qualify names for stub matching without changing the names sent to the model. */
export declare function stubToolPath(scope: StubScope | undefined, tool: string): string;
export declare function findStubTarget(scope: StubScope | undefined, tool: string): {
    scope: StubScope;
    tool: string;
} | undefined;
export declare function stubCallId(sessionId: string, turnId: string, callId: string): string;
