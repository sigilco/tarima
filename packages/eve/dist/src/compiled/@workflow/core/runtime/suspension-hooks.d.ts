import { type CreateEventParams, type CreateEventRequest, type EventResult, type SerializedData, type WorkflowRun, type World } from '#compiled/@workflow/world/index.js';
import { importKey } from '../encryption.js';
import type { HookInvocationQueueItem, WorkflowSuspension } from '../global.js';
import type { SuspensionSerializationBlocker } from './delivery.js';
/**
 * Await every operation in a suspension phase before letting a failure
 * escape, preferring a stale-snapshot (412) rejection when one occurred.
 *
 * `Promise.all` rejects as soon as one operation does and leaves its siblings
 * in flight. That matters for a 412: the caller reacts by reloading the event
 * log and restarting the replay, so a sibling create that lands after the
 * rejection escaped commits an event whose correlation id came from the
 * abandoned replay's seeded sequence (an event the fresh replay never
 * produces), and it races the restart's reload while doing so. Settling first
 * makes this phase's write set final before the caller acts on the failure.
 * It mirrors the runtime's inline step claim, which settles the in-flight
 * step executions before escalating a 412.
 *
 * A 412 is preferred over any other rejection in the same phase because it
 * has a defined, cheap recovery (replay from a corrected log) while the
 * others do not. A deterministic failure such as an attribute-validation
 * `FatalError` recurs on the restart and fails the run then, at the cost of
 * one extra replay.
 */
export declare function settlePhase(ops: Promise<unknown>[]): Promise<void>;
/** What {@link startSuspensionHookWrites} hands back to its suspension. */
export interface SuspensionHookWrites {
    readonly encryptionKey: Awaited<ReturnType<typeof importKey>> | undefined;
    /** Whether payloads are compressed (gated on the run's spec version). */
    readonly compression: boolean;
    /** Serializes a payload of the suspension, counting the workflow code it ran. */
    dehydrateInput(value: unknown, context: Pick<SuspensionSerializationBlocker, 'source' | 'correlationId'>): Promise<SerializedData>;
    /** Workflow-code executions observed while serializing (see `getRetentionDecision`). */
    readonly blockers: {
        count: number;
        sample: SuspensionSerializationBlocker[];
    };
    readonly hookConflictCorrelationIds: string[];
    readonly awaitedHookCorrelationIds: string[];
    /** The hook writes, already in flight; undefined when there are none. */
    readonly hookOp: Promise<void> | undefined;
    /** When the hook groups started and settled, for the hook creation time. */
    hookGroupsWindow(): {
        startMs: number;
        endMs?: number;
    } | undefined;
}
/**
 * Starts a suspension's hook writes. They go out alongside the suspension's
 * other writes: the caller settles `hookOp` with the rest.
 */
export declare function startSuspensionHookWrites({ suspension, world, run, runId, requestId, allHookItems, hooksNeedingCreation, eventLog, forceClaimVictimWakes, createGuarded, hookCreateEvent, eventSpecVersion, beforeWrites, terminalDrain, }: {
    suspension: WorkflowSuspension;
    world: World;
    run: WorkflowRun;
    runId: string;
    requestId?: string;
    allHookItems: HookInvocationQueueItem[];
    hooksNeedingCreation: HookInvocationQueueItem[];
    /** The log the suspension's replay read; its cursor is the hook delta's. */
    eventLog?: {
        cursor: string | null;
    };
    forceClaimVictimWakes?: Set<string>;
    createGuarded: (data: CreateEventRequest, params?: CreateEventParams) => Promise<EventResult>;
    /**
     * The creator for one hook's `hook_created`, in place of `createGuarded`;
     * `undefined` keeps `createGuarded`. Spec 8 creates independent concurrent
     * registrations without their catch-up position and reconciles their
     * responses together (see its `handleSuspension`).
     */
    hookCreateEvent?: (queueItem: HookInvocationQueueItem) => ((data: CreateEventRequest, params?: CreateEventParams) => Promise<EventResult>) | undefined;
    /** The spec version the hook events are stamped with. */
    eventSpecVersion: number;
    /** Awaited before the first hook write. */
    beforeWrites?: () => Promise<unknown>;
    /**
     * The workflow is completing or failing. Its terminal event cleans up hooks,
     * so only dispose hooks needed to release a token early or for a later
     * registration.
     */
    terminalDrain?: boolean;
}): Promise<SuspensionHookWrites>;
//# sourceMappingURL=suspension-hooks.d.ts.map