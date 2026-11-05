import type { DeliverHookPayload } from "#channel/types.js";
import { type DurableSessionState } from "#execution/durable-session-store.js";
import { type SessionStepState } from "#execution/publish-session-events.js";
import { type WithSessionStateDelta } from "#execution/session/state-delta.js";
export type RoutedDeliverResult = {
    readonly kind: "cancel-turn";
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
} | {
    readonly kind: "continue";
    readonly remainder: DeliverHookPayload | undefined;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
};
/**
 * Splits an envelope and forwards descendant input to the child that asked for
 * it. This session relayed each forwarded request's `interaction.opened`, so it
 * also relays their `interaction.settled` once the answers are on their way down.
 */
export declare function routeProxiedDeliverStep(input: SessionStepState & {
    readonly delivery: DeliverHookPayload;
}): Promise<WithSessionStateDelta<RoutedDeliverResult>>;
/**
 * Names one delivery's answers to one child, stable across retries and within the key limit. A
 * delivery that names no delivery ids has nothing stable to name its answers by, so it gets none.
 */
export declare function answersIdempotencyKey(delivery: DeliverHookPayload, childKey: string): Promise<string | undefined>;
/**
 * Maps a delivery's channel-specific answers to the requests a held turn waits
 * on, so the turn can tell they answer it. Returns the mapped delivery, or
 * `undefined` when the channel maps none of them to one of `requestIds`.
 */
export declare function mapHeldAnswersStep(input: SessionStepState & {
    readonly delivery: DeliverHookPayload;
    readonly requestIds: readonly string[];
}): Promise<WithSessionStateDelta<{
    readonly delivery: DeliverHookPayload | undefined;
}>>;
