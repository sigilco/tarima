import type { World } from '#compiled/@workflow/world/index.js';
/**
 * The last position each run's orchestrator consumed in this process, so a
 * wake that finds nothing new can be acknowledged without a replay.
 *
 * Every out-of-band writer sends an unkeyed wake after it commits, and a live
 * orchestrator often consumes the event over the live feed before the wake is
 * delivered. That delivery then has nothing to do. It reads the log tail
 * (one small read), and when the tail slot equals the position recorded here
 * and no recorded timer is due, it exits. A miss (another process ran the
 * orchestrator, or this one restarted) costs only the normal replay.
 *
 * Recorded only after a delivery finished cleanly: its writes committed and
 * it scheduled what it had to (step messages, timers). A position recorded
 * before that would let a wake skip work the crashed delivery never did.
 */
export interface ConsumedPosition {
    /** Highest slot the orchestrator had consumed when it suspended. */
    slot: number;
    /** Earliest `resumeAt` among the run's open waits, epoch ms. */
    nextTimerAtMs?: number;
}
export declare function recordConsumedPosition(world: World, runId: string, position: ConsumedPosition): void;
export declare function hasConsumedPosition(world: World, runId: string): boolean;
export declare function forgetConsumedPosition(world: World, runId: string): void;
/**
 * Whether a delivery for `runId` whose log tail is at `tailSlot` has nothing
 * to do.
 */
export declare function isNoopDelivery(params: {
    world: World;
    runId: string;
    tailSlot: number | undefined;
    nowMs: number;
}): boolean;
/** Test hook. */
export declare function __resetConsumedPositionsForTests(world: World): void;
//# sourceMappingURL=consumed-position.d.ts.map