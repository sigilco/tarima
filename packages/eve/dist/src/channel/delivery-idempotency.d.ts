/** Maximum number of distinct delivery keys remembered by one logical session. */
export declare const DELIVERY_IDEMPOTENCY_WINDOW = 1024;
export declare const MAX_DELIVERY_IDEMPOTENCY_KEY_LENGTH = 256;
export declare function validateDeliveryIdempotencyKey(key: unknown): asserts key is string | undefined;
/**
 * The delivery id a caller's idempotency key names, so a repeated request is the same delivery
 * with the same receipt. UUID-shaped, like the ids the framework mints; within one session, keys
 * name distinct deliveries.
 */
export declare function deliveryIdForIdempotencyKey(key: string): Promise<string>;
