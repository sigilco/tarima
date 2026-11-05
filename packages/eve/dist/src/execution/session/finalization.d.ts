import type { ControlDelivery } from "#harness/types.js";
import type { ControlSettlement } from "#harness/facts.js";
import type { TurnCaller } from "#channel/types.js";
import type { DurableSessionState } from "#execution/durable-session-store.js";
import type { TurnOutcome } from "#execution/session/turn-step-types.js";
import type { WorkflowEntryResult } from "#execution/session/entry-input.js";
/** The three ways a session ends. `done` already emitted its terminal event inside the turn. */
export type SessionTerminalOutcome = {
    readonly kind: "done";
    readonly action: TurnOutcome & {
        readonly kind: "done";
    };
} | {
    readonly kind: "expired";
    readonly control?: ControlDelivery;
    readonly settles?: readonly ControlSettlement[];
} | {
    readonly kind: "failed";
    readonly error: unknown;
    readonly turnId?: string;
};
interface SessionFinalizationContext {
    readonly caller: TurnCaller | undefined;
    readonly cursor: {
        readonly serializedContext: Record<string, unknown>;
        readonly sessionState: DurableSessionState | undefined;
    };
    readonly sessionWritable: WritableStream<Uint8Array>;
}
/**
 * Terminates descendants, emits the terminal protocol event when the turn has
 * not already done so, then settles the parked caller waiting on this session.
 */
export declare function finalizeSession(outcome: SessionTerminalOutcome, context: SessionFinalizationContext): Promise<WorkflowEntryResult>;
export {};
