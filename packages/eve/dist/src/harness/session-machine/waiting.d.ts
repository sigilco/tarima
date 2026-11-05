import type { Commit } from "#harness/types.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
/**
 * What a step announces as it ends, from the tables before and after it: that the open turn
 * waits on interactions — `turn.paused` with the interactions, and `awaiting-input` for the
 * deliveries the turn answers for now. It announces when the step leaves the turn waiting on
 * someone it didn't wait on before, or a delivery arrived or moved during the step and can go
 * no further: one answer of a batch still waiting for the rest, or a message queued behind a
 * budget question. A step that only finds the turn as it was announces nothing.
 *
 * A step is the session's unit of progress: inside one, a line can look as if nothing is left
 * to do while the step goes on, so only its end can say. Every step's publisher asks here, so
 * nothing the session runs announces a pause itself, and the announcement materializes
 * `waiting(view, turnId)` for readers that follow the stream from a cursor without folding.
 */
export declare function announceWaiting(before: SessionView, after: SessionView): Commit;
