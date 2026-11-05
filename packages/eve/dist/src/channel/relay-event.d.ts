import type { RelayedInteractionEvent } from "#channel/types.js";
type RelayedOf<T extends RelayedInteractionEvent["type"]> = Extract<RelayedInteractionEvent, {
    readonly type: T;
}>;
/**
 * One event of a relay payload, without the fields its data leaves undefined. A relay carries the
 * asker's interaction facts as transport; the serving session's `relay` transition turns them into
 * its own facts, so building one here writes nothing to a session.
 */
export declare function relayEvent<T extends RelayedInteractionEvent["type"]>(type: T, data: RelayedOf<T>["data"]): RelayedOf<T>;
export {};
