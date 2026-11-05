/**
 * Disables world-local's delivery deadlines unless the operator supplied an
 * override. world-local snapshots these values when `createWorld()` constructs
 * its queue and supports `0` as an unbounded timeout. Without this default, a
 * long owner turn can be retried while its original provider call is active.
 */
export declare function applyLocalWorkflowWorldDeliveryTimeoutDefaults(env?: Record<string, string | undefined>): void;
