/** Sends settled turn results to the caller of each turn. */
import type { TurnCaller } from "#channel/types.js";
import type { AgentTurnOutcome } from "#shared/agent-turn-outcome.js";
import type { TokenUsage } from "#shared/token-usage.js";
/** Settled turn payload forwarded from the owner to the caller. */
export interface SettledTurnNotification {
    readonly output: unknown;
    readonly isError?: boolean;
    /** Usage accumulated since the previous caller settlement, including yielded turns. */
    readonly usage?: TokenUsage;
}
/**
 * Sends a settled conversation turn to the caller that started it.
 *
 * `lifecycle` is the child engine's explicit verdict — `parked` when the
 * child session survived the turn and can accept another delivery,
 * `terminal` when it ended with this turn. It is carried on the result as
 * an {@link AgentTurnOutcome} so the caller never infers lifecycle from
 * success or error codes.
 */
export declare function notifyTurnCallerStep(input: {
    readonly caller: TurnCaller | undefined;
    readonly lifecycle: AgentTurnOutcome["kind"];
    readonly sessionId: string;
    readonly settled: SettledTurnNotification;
}): Promise<void>;
/** Settles a workflow-owned caller after the child turn is cooperatively cancelled. */
export declare function notifyCancelledTaskCallerStep(input: {
    readonly caller: TurnCaller;
    readonly sessionId: string;
    readonly usage?: TokenUsage;
}): Promise<void>;
/** Resolves the caller that created a delegated conversation session. */
export declare function resolveInitialTurnCallerStep(input: {
    readonly serializedContext: Record<string, unknown>;
}): Promise<TurnCaller | undefined>;
/**
 * Points child event forwarding at the caller that owns the next accepted turn,
 * so the turn's input requests and progress reach that caller and not the
 * previous one.
 */
export declare function bindTurnCallerContext(caller: TurnCaller | undefined, serializedContext: Record<string, unknown>): Record<string, unknown>;
/**
 * How long a result waits on a caller whose callback reports nothing pending, in case the caller
 * hasn't registered the reply it sent the token for yet.
 */
export declare const NOT_PENDING_RETRY_DELAYS_MS: readonly number[];
