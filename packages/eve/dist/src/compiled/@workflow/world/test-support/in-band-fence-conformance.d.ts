import type { Storage, WorldCapabilities } from '../interfaces.js';
/**
 * Conformance for the in-band writer fence a World that creates spec 9 runs
 * implements (see `Storage['events']` and `CreateEventParams.inBand`).
 *
 * What every such World must agree on, whatever it stores the count in:
 *
 * - It declares `capabilities.inBandFence`, without which the runtime refuses
 *   it.
 * - `list` returns `snapshot: { seq, seqInBand }`, and a new run holds one
 *   in-band position (`run_created`'s), which `atRunCreation` names.
 * - An in-band write at the current count is accepted and advances it by one.
 * - A stale in-band write is refused with `InBandSupersededError` (412,
 *   `in-band-superseded`) and allocates nothing: the log and the counts are
 *   unchanged, and the next accepted write takes the very next slot.
 * - Out-of-band writes move `seq` and never `seqInBand`.
 * - Of several concurrent in-band writers holding the same count, exactly one
 *   wins.
 * - An in-band write with no expected count is refused with a 400.
 * - The single-orchestrator step bookkeeping (`inline`, `creatorMessageId`,
 *   `stepName`, `attempt`) survives the round trip, including the
 *   `creatorMessageId` of an inline step's `step_retrying`.
 * - An in-band write is stored with the `occurredAt` it was sent with as its
 *   `createdAt`.
 *
 * Import it from a World's own test file (by relative path, like the other
 * test-support modules) and call it at module level.
 */
export interface InBandFenceConformanceOptions {
    /** Describe-block name, usually the World's name. */
    name: string;
    /** The events storage under test. Called once per test. */
    events: () => Storage['events'];
    /** The capabilities the World under test declares (`World.capabilities`). */
    capabilities: () => WorldCapabilities | undefined;
    /** A run id for `run_created`, or `null` when the World mints it. */
    newRunId: () => string | null;
    /** In-band positions a new run holds (the World's documented initial count). */
    atRunCreation: number;
    /**
     * A second events storage over the same backing data as the one passed in
     * (for example a second instance on the same data directory or database),
     * to check that the fence is shared between instances. Omit when the World
     * cannot have two instances over one store.
     */
    secondEvents?: (first: Storage['events']) => Storage['events'];
    /** How many concurrent writers to race. Defaults to 8. */
    concurrentWriters?: number;
}
export declare function inBandFenceConformance(options: InBandFenceConformanceOptions): void;
//# sourceMappingURL=in-band-fence-conformance.d.ts.map