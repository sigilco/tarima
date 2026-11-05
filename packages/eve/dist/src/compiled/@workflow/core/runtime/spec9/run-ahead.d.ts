import type { Event, World } from '#compiled/@workflow/world/index.js';
import type { OutOfBandObservation } from '../out-of-band-observation.js';
/**
 * What the boundary a speculative write ran ahead of allowed to land below
 * it: the classification of `observeOutOfBandWriters`, kept as the ids it
 * was made from.
 */
export interface RunAheadContext {
    /**
     * Open hooks whose next event could change the workflow's path: hooks
     * workflow code waits on, hooks with unknown observation, and system
     * (abort) hooks. Empty at an inert boundary; kept so a check can name one.
     */
    sensitiveHookIds: ReadonlySet<string>;
    /** Steps this delivery runs inline: only it writes their events. */
    selfStepIds: ReadonlySet<string>;
}
/**
 * Stops a delivery that ran ahead of its writes: a speculative write failed
 * a check before anything else was written. The delivery is redelivered and
 * decides from the log.
 */
export declare class RunAheadStopError extends Error {
    readonly reason: string;
    constructor(reason: string);
    static is(value: unknown): value is RunAheadStopError;
}
/**
 * Why `event`, seen below a speculative write, would have made the boundary
 * of `context` path-changing, or `undefined` when it is inert there (or is
 * the delivery's own). See `runtime/out-of-band-observation.ts` for the
 * writers and why each is or is not path-changing.
 */
export declare function runAheadHazard(event: Event, context: RunAheadContext, isOwn: (event: Event) => boolean): string | undefined;
/**
 * Whether an event another writer placed below a run-ahead's speculative
 * events may still join the retained session that consumed them, fed after
 * them. True only where the event's position cannot move a decision on the
 * node:vm engine (see `../out-of-band-observation.ts`): a hook event for a
 * hook no boundary of the run-ahead was sensitive to (buffered as an unarmed
 * delivery, it orders nothing and leaves the clock alone), an attribute
 * write, or a sealed position. Anything else sends the session to a cold
 * replay of the corrected log.
 */
export declare function admitBelowSpeculation(event: Event, sensitiveHookIds: ReadonlySet<string>): boolean;
/** The context of a boundary from its suspension's queue. */
export declare function runAheadContextFor(input: {
    observation: OutOfBandObservation;
    hookItems: readonly {
        correlationId: string;
        isSystem?: boolean;
        disposed?: boolean;
    }[];
    observedHookIds: ReadonlySet<string> | undefined;
    selfStepIds: ReadonlySet<string>;
}): RunAheadContext;
/**
 * Whether run-ahead is off for `world` in this process: one of its in-band
 * writes came back with a time other than the `occurredAt` the orchestrator
 * sent, so a workflow that ran ahead of it would read a `Date.now()` replay
 * never reproduces.
 */
export declare function isRunAheadDisabledFor(world: World): boolean;
export declare function disableRunAheadFor(world: World): void;
//# sourceMappingURL=run-ahead.d.ts.map