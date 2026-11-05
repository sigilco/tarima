import type { World } from '#compiled/@workflow/world/index.js';
/**
 * How long a start Hook's holder may stay `pending` before a refused
 * duplicate re-publishes its orchestrator message. A normal start is picked
 * up within seconds (a cold deployment within tens of seconds), so a holder
 * still pending past this has most likely lost its message: a boot crash
 * loop past the queue's retention, a message dropped after an uncertain
 * enqueue. Re-publishing sooner would only double a startup in flight.
 */
export declare const START_HOOK_HOLDER_WAKE_AFTER_MS = 60000;
/**
 * Re-publishes from one holder at most once per this window, whatever the
 * number of duplicates refused in it. For a holder before spec 9 the
 * re-publish's queue idempotency key is bucketed by it, which holds across
 * processes. It is deliberately not the original start message's key, whose
 * deduplication (up to 24h on Vercel Queues) would swallow a wake for the
 * very message that was lost. A single-orchestrator holder's wake carries no
 * key (see `wakePendingStartHookHolder`), so each process holds it to the
 * window instead (`singleOrchestratorWakes`).
 */
export declare const START_HOOK_HOLDER_WAKE_WINDOW_MS = 60000;
/** Forgets every claimed single-orchestrator wake. For tests. */
export declare function resetStartHookHolderWakes(): void;
/** The queue idempotency key for a holder's re-publish in this window. */
export declare function startHookHolderWakeKey(runId: string, nowMs: number): string;
/**
 * What a holder wake did: `woken` (re-published), `not_pending` (the holder
 * is running or ended), `too_young` (still within a normal startup),
 * `throttled` (a single-orchestrator holder this process already woke in this
 * window), `not_found` (no such run: the refusal named an accepted candidate
 * whose run was never created) or `error` (the check or the publish failed).
 */
export type StartHookHolderWakeResult = 'woken' | 'not_pending' | 'too_young' | 'throttled' | 'not_found' | 'error';
/**
 * A refused `start({ experimental_hook })` names the token's holder. When that holder is
 * a run still `pending` well past a normal startup, its first orchestrator
 * message was most likely lost and nothing else will start it, so the token
 * would stay held by a run that never runs. Re-publish a plain orchestrator
 * message for it (no `runInput`: the run exists), to its own deployment,
 * namespace and spec version, the same message a re-enqueue sends.
 *
 * Best effort and never in the caller's way: a holder that is not pending,
 * not old enough, or not found (a refusal can name an accepted candidate
 * whose run was never created) publishes nothing, and any failure is logged
 * and swallowed. The caller still throws its `HookConflictError`. Each result
 * is logged with its reason: at debug when nothing needed doing, at info when
 * it woke the holder, at warn on an error.
 */
export declare function wakePendingStartHookHolder(world: World, holderRunId: string, traceCarrier: Record<string, string>): Promise<StartHookHolderWakeResult>;
//# sourceMappingURL=start-hook-holder.d.ts.map