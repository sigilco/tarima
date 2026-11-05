import { type CreateEventParams, type CreateEventRequest, type EventResult, type World } from '#compiled/@workflow/world/index.js';
import type { HookInvocationQueueItem } from '../global.js';
/**
 * Writes one hook's `hook_created`, for either orchestrator's suspension: the
 * World answers a taken token with a `hook_conflict`, and a forced creation
 * that took the token over wakes the run it was taken from.
 */
export declare function createHookEvent({ runId, hookEvent, queueItem, requestId, sinceCursor, createEvent, world, forceClaimVictimWakes, }: {
    runId: string;
    hookEvent: CreateEventRequest;
    queueItem: HookInvocationQueueItem;
    requestId?: string;
    /**
     * Needed only to wake the run a forced creation took its token from; see
     * `publishForceClaimVictimWake`.
     */
    world: World;
    /**
     * Hooks whose force-claim victim wake this invocation already sent (see
     * `forceClaimVictimWakes` on each orchestrator's `handleSuspension`).
     */
    forceClaimVictimWakes?: Set<string>;
    /**
     * Cursor to ask the World for the event-log delta against, or undefined to
     * not ask. See `hookDeltaCursor` in each orchestrator's `handleSuspension`
     * for when it is
     * set and why it is at most one write per suspension.
     */
    sinceCursor?: string;
    createEvent: (data: CreateEventRequest, params?: CreateEventParams) => Promise<EventResult>;
}): Promise<{
    hasHookConflict: boolean;
    hasAwaitedHookCreation: boolean;
}>;
/**
 * Whether an `events.create` rejection is deterministic World validation
 * rather than a transient/storage error. Local Worlds
 * (world-local, world-postgres) throw `AttributeValidationError` directly;
 * remote Worlds surface the equivalent server-side rejection as a
 * `WorkflowWorldError` with HTTP status 400. The name check covers
 * `AttributeValidationError` instances from a different copy of
 * `@workflow/world` than the one this package resolved.
 */
export declare function isWorldValidationFailure(err: unknown): boolean;
//# sourceMappingURL=hook-creation.d.ts.map