import type { DurableSessionState } from "#execution/durable-session-store.js";
import { type SessionHistoryStepState } from "#execution/publish-session-events.js";
import { type WithSessionStateDelta } from "#execution/session/state-delta.js";
import type { HarnessModelMessage } from "#harness/messages.js";
import type { ControlDelivery } from "#harness/types.js";
import type { TokenUsage } from "#shared/token-usage.js";
export interface CancelledTurnSettleResult {
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
    readonly history: HarnessModelMessage[];
    /** What the session spent since its caller's last report, when asked to report it. */
    readonly usage?: TokenUsage;
}
/** Takes the history because the steps the cancel stopped commit to it. */
interface CancelledTurnSettleInput extends SessionHistoryStepState {
    /**
     * Whether a caller receives the turn's usage. Only then is it marked
     * reported; otherwise the next settled turn reports it.
     */
    readonly reportUsage: boolean;
    /** The cancel control that stopped the turn, when it named its delivery. */
    readonly control?: ControlDelivery;
}
/**
 * Settles one cancelled turn through the machine's `cancel`, and persists
 * the between-turns session. Runs in the owner, whose wake sources exclude the
 * cancel hook, so a queued cancel wake cannot re-dispatch it.
 */
export declare function settleCancelledTurnStep(input: CancelledTurnSettleInput): Promise<WithSessionStateDelta<CancelledTurnSettleResult>>;
/** {@link settleCancelledTurnStep} for a caller that is already a step and adopts the whole state. */
export declare function settleCancelledTurn(input: CancelledTurnSettleInput): Promise<CancelledTurnSettleResult>;
export {};
