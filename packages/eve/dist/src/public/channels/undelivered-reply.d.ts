import type { ChannelDelivery } from "#shared/channel-delivery.js";
import { type Logger } from "#internal/logging.js";
/** Channel state that remembers a final reply the user never saw. */
export interface UndeliveredReplyState {
}
/** Where a channel's final reply failed, and how to post a notice there. */
export interface UndeliveredReplySurface {
    readonly log: Logger;
    /** The surface as the user and the model know it, e.g. `"Slack"`. */
    readonly name: string;
    readonly post: (notice: string) => Promise<unknown>;
    readonly state: UndeliveredReplyState;
}
/**
 * Records a final reply that failed to reach the user: logs `error` at error
 * level, remembers its error id for {@link withUndeliveredReplyNote}, and
 * posts a notice that names the id without repeating the reply. A failed
 * notice is logged, not thrown.
 */
export declare function reportUndeliveredReply(surface: UndeliveredReplySurface, turnId: string, error: unknown): Promise<void>;
/**
 * Tells the model, ahead of the next message, that its previous reply never
 * reached `surfaceName`, so it does not assume the user read that reply.
 */
export declare function withUndeliveredReplyNote<T extends ChannelDelivery<unknown>>(state: UndeliveredReplyState, payload: T, surfaceName: string): T;
