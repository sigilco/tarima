import type { TokenUsage } from "#shared/token-usage.js";
import type { SessionProjection } from "#protocol/session-projection.js";
import type { DurableSessionState } from "#execution/durable-session-store.js";
/** Emits a terminal `session.ended` to the adapter and durable stream. */
export declare function emitTerminalSessionFailureStep(input: {
    readonly error: unknown;
    readonly sessionWritable: WritableStream<Uint8Array>;
    readonly serializedContext: Record<string, unknown>;
    readonly turnId?: string;
    readonly usage: TokenUsage | undefined;
    /** The session's last checkpointed projection. */
    readonly projection?: SessionProjection;
    readonly sessionState?: DurableSessionState;
}): Promise<void>;
