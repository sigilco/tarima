import type { World } from "#compiled/@workflow/world/index.js";
/**
 * Makes the World acknowledge, without replaying, queue deliveries for
 * top-level eve session runs that another eve version started. Worlds that
 * re-enqueue their active runs at startup (local, Postgres) would otherwise
 * replay such a run on this build's code and fail it as `CORRUPTED_EVENT_LOG`.
 * A top-level session stays active until ingress replaces it or its timeout
 * ends it. Subagent sessions and workflow tool runs are cancelled instead:
 * no later user message can replace their interrupted work. Ingress refuses
 * the same owners by the same verdict, so preserved owners cannot admit work.
 * Timeout workflows remain runnable so they can end preserved sessions.
 *
 * Mutates and returns `world`; only its `createQueueHandler` changes. Worlds
 * that replay each run on its own deployment are returned untouched.
 */
export declare function guardStrandedSessionReplay<TWorld extends World>(world: TWorld): TWorld;
