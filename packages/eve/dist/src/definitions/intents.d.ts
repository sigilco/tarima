import type { DeliverHookPayload } from "#channel/types.js";
import type { ContextContainer } from "#context/container.js";
import { type PendingIntent } from "./state.js";
/** A command a hook asked for, before it's queued. */
export type Command = {
    readonly type: "cancel";
    readonly reason?: string;
} | {
    readonly type: "continue";
    readonly turnId: string;
    readonly delivery: DeliverHookPayload;
};
/**
 * Adds a hook's commands to the session's queue. Cancels between turns are dropped; each hook's
 * continuation joins the turn's one continuation delivery.
 */
export declare function queueCommands(ctx: ContextContainer, definition: {
    readonly id: string;
    readonly label: string;
}, occurrence: string, commands: readonly Command[]): void;
/** Removes and returns the waiting intents that match, because the session acted on them. */
export declare function takeIntents(ctx: ContextContainer, matches: (intent: PendingIntent) => boolean): readonly PendingIntent[];
/**
 * A hook, or an effect eve runs after a commit, failed. During a turn, the turn fails at its next
 * boundary: before its next model call, or as it would settle. Between turns, there's no turn to
 * fail, and the failure is logged.
 */
export declare function reportEffectFailure(ctx: ContextContainer, definition: {
    readonly id: string;
    readonly label: string;
}, error: unknown, occurrence?: string): void;
/** Takes the failure a hook reported for the running turn, if any. */
export declare function takeTurnFailure(ctx: ContextContainer): string | undefined;
