import { type DurableSessionState } from "#execution/durable-session-store.js";
import type { SandboxSessionEndReason } from "#sandbox/state.js";
export declare function reportSessionSandboxCleanupFailureStep(input: {
    readonly error: unknown;
    readonly outcome: string;
    readonly sessionId: string;
}): Promise<void>;
export declare function endSessionSandboxStep(input: {
    readonly reason: SandboxSessionEndReason;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
}): Promise<void>;
