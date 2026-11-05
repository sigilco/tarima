import type { SessionStreamEvent } from "#protocol/session-event.js";
import type { Delivery, DeliveryReadOptions, DeliveryResult } from "#shared/delivery.js";
export type { Delivery } from "#shared/delivery.js";
interface DeliveryInput {
    readonly inbox?: string;
    readonly createStream: (options?: DeliveryReadOptions) => AsyncIterable<SessionStreamEvent>;
    readonly deliveryId: string;
    readonly sessionId: string;
}
/** An accepted command: its receipt and independent reads through its own settlement. */
export declare class StreamDelivery<TOutput = unknown> implements Delivery<TOutput> {
    #private;
    readonly sessionId: string;
    readonly deliveryId: string;
    /** Opaque value to store with the session state; see `ClientSessionState.inbox`. */
    readonly inbox?: string;
    /** Built by the eve client for each command the server accepts. */
    constructor(input: DeliveryInput);
    /** Independent, replayable read; exiting it never consumes the handle. */
    stream(options?: DeliveryReadOptions): AsyncGenerator<SessionStreamEvent>;
    /** Caches only a completed summary; failed/aborted reads can be retried. */
    result(options?: DeliveryReadOptions): Promise<DeliveryResult<TOutput>>;
}
