import type { Commit } from "#harness/types.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
import { type Ref } from "#protocol/session-projection/tree.js";
/**
 * An owner's end ends everything under it, in the same commit. For each fact that ends an entity
 * still holding open ones, this closes them first, leaves first, as their families close when
 * an owner ends; the deliveries a turn consumed settle after it. Writers that already closed
 * them leave nothing to add.
 */
export declare function cascade(view: SessionView, events: readonly SessionEvent[]): SessionEvent[];
/** The facts that close everything open under `owner`, leaves first, as it its owner cut it. */
export declare function closeUnder(view: SessionView, owner: Ref, reason: string): SessionEvent[];
/**
 * The facts that close the open entities `which` selects, leaves first, as a retry superseded
 * them. The writer closes what each leaves open under it.
 */
export declare function supersede(view: SessionView, which: (ref: Ref) => boolean, reason: string): Commit;
