import type { DeliverHookPayload, SessionCapabilities } from "#channel/types.js";
import type { AgentWorkflowRetentionDefinition } from "#shared/agent-definition.js";
export interface LegacyTurnInput {
    readonly completionToken: string;
    readonly capabilities?: SessionCapabilities;
    readonly retention?: AgentWorkflowRetentionDefinition;
    readonly sessionWritable: WritableStream<Uint8Array>;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: Record<string, unknown> & {
        sessionId: string;
    };
    /** Only an uncommitted `deliver` continues as the first turn; controls and results were the driver's. */
    readonly delivery: DeliverHookPayload | undefined;
    readonly inputCommitted: boolean;
}
/** Reads a versioned turn-workflow input from a pre-cutover driver (eve 0.45 – 0.55). */
export declare function readLegacyTurnInput(value: unknown): LegacyTurnInput;
