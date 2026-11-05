import { type LegacyTurnInput } from "./input.js";
/** Persist the import before publishing its current-generation inbox. */
export declare function prepareLegacySessionStep(rawInput: unknown): Promise<{
    input: {
        completionToken: string;
        capabilities?: import("../../channel/types.ts").SessionCapabilities;
        sessionWritable: WritableStream<Uint8Array>;
        serializedContext: Record<string, unknown>;
        sessionState: Record<string, unknown> & {
            sessionId: string;
        };
        delivery: import("../../channel/types.ts").DeliverHookPayload | undefined;
        inputCommitted: boolean;
        retention: "default" | 0 | undefined;
    };
    history: import("../../harness/messages.ts").HarnessModelMessage[];
    originalSession: import("./snapshot.js").LegacySession;
    sessionState: import("../durable-session-store.ts").DurableSessionState;
    serializedContext: Record<string, unknown>;
    sessionTimeoutMs: number | false;
    deploymentId: string;
}>;
export type PreparedLegacySession = Awaited<ReturnType<typeof prepareLegacySessionStep>>;
export type { LegacyTurnInput };
