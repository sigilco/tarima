import type { DeliverHookPayload } from "#channel/types.js";
export declare const REACTIONS_STATE_KEY = "eve.reactions";
/**
 * The session's continuation of a settled turn: one delivery that starts its next turn, with a
 * payload for each hook that called `ctx.continue()`. Any other turn that starts first discards it,
 * as do a cancel, a clear, and a reset.
 */
export interface Continuation {
    /** The settled turn it continues. */
    readonly turnId: string;
    readonly delivery: DeliverHookPayload;
}
/** The idempotency key of a turn's continuation: one delivery per settled turn. */
export declare function continuationKey(sessionId: string, turnId: string): string;
/**
 * The continuation hooks queued after `latestTurnId` settled, while no other turn has started
 * since. The session admits it only when nothing else waits.
 */
export declare function pendingContinuation(serializedContext: Readonly<Record<string, unknown>>, latestTurnId: string | undefined): DeliverHookPayload | undefined;
