import type { SessionEvent, SessionStreamEvent } from "#protocol/session-event.js";
import { type StoredLine } from "#protocol/session-events/envelope.js";
/** Reads consecutive stored lines of one session an eve before v27 started, from its first. */
export interface V26HistoryReader {
    /**
     * The v27 line the record at `position` reads as, or `undefined` when it records nothing a v27
     * reader folds, such as a streamed delta. A v27 line reads as itself: a v27 deployment that
     * ends a stranded v26 session appends its end as one.
     */
    read(record: unknown, position: number): StoredLine<SessionEvent> | undefined;
}
/** A reader for one session's stored v26 lines. Read them in order, from position 0. */
export declare function createV26HistoryReader(): V26HistoryReader;
/**
 * The v27 lines a v26 session's stored records read as, from position `from` on: one output per
 * record, a `position` marker for a record that reads as none, so cursors keep counting stored
 * lines. `records` must start at position 0: each record reads in light of those before it.
 */
export declare function v26LineStream(records: ReadableStream<unknown>, from: number): ReadableStream<unknown>;
/**
 * The events one session's saved v26 events read as, for an application that kept them: the
 * events a v27 reader of the session's stream would read from them, at the same positions. They
 * must be the session's events from its first, one per stored line, in order, as a v26 client
 * read them from position 0; the next stored line is then at `records.length`. If trailing
 * records emit nothing, the last event's `meta.next` retains that source coverage without
 * changing any event's original position. Save the returned reader metadata unchanged.
 */
export declare function convertLegacyEvents(records: readonly unknown[]): SessionStreamEvent[];
