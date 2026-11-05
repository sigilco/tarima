import type { Event } from '#compiled/@workflow/world/index.js';
import type { EventsConsumer } from './events-consumer.js';
import type { QueueItem } from './global.js';
/**
 * Step, wait, hook and attribute correlation ids share one ULID draw per
 * entity, prefixed by kind (`step_<ulid>`, `wait_<ulid>`, `hook_<ulid>`,
 * `attr_<ulid>`). A replay that drew the same ordinal for a different kind of
 * entity than the one the log recorded there produces an event nobody can
 * consume, and the decisive fact for diagnosing that is which pending
 * invocation currently holds the ordinal. This looks it up by the shared ULID
 * body, so a `wait_created` the log holds at a position where the replay is
 * waiting on `step_<same ulid>` names that step.
 */
export declare function findPendingItemAtOrdinal(invocationsQueue: Map<string, QueueItem>, correlationId: string): QueueItem | undefined;
/**
 * The detail appended to a `ReplayDivergenceError` raised because the replay
 * could not place an event. Callers keep their own leading sentence (tests and
 * users match on it) and append this after it.
 *
 * Example:
 * `pending at this id: step drainStep (step_01K…). consumer: index=41,
 * length=44, parked=0, lastConsumed=evnt_01K…`
 */
export declare function describeDivergenceContext(event: Event, invocationsQueue: Map<string, QueueItem>, eventsConsumer: EventsConsumer): string;
//# sourceMappingURL=replay-divergence.d.ts.map