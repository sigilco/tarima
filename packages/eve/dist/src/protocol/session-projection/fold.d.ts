import type { StoredLine } from "#protocol/session-events/envelope.js";
import type { SessionPreviews, SessionView } from "./tables.js";
/**
 * How much a fold keeps. `complete` keeps everything, for clients and history reads.
 * `operational` keeps the session, everything still open and its ownership ancestors, what the
 * latest line touched, the latest turn's reply, and the rows of the latest turn and of any turn
 * whose calls still work, for
 * server checkpoints and observers; it drops the rest when the next line arrives. A channel shows
 * what a turn did from its rows, so they stay until the next turn starts, or its tasks finish.
 */
export type Retention = "complete" | "operational";
export interface FoldOptions {
    readonly retention?: Retention;
    /** In operational retention, rows to keep after they close, such as ones execution still reads. */
    readonly keep?: (table: TableName, id: string) => boolean;
}
export type TableName = "deliveries" | "turns" | "runs" | "parts" | "calls" | "tasks" | "interactions" | "responses" | "children" | "changes";
export declare function emptySessionView(): SessionView;
export declare function emptyPreviews(): SessionPreviews;
/**
 * Folds the line at `position` into `view`, and its progress or completions into `previews`.
 * A line at or before the view's position was already folded and is skipped, which absorbs
 * reconnect overlap and merged caches.
 */
export declare function foldLine(view: SessionView, line: StoredLine, position: number, options?: FoldOptions & {
    readonly previews?: SessionPreviews;
}): void;
/** Folds lines read from `startPosition` on, for a reader that holds a whole range. */
export declare function foldLines(view: SessionView, lines: Iterable<StoredLine>, startPosition: number, options?: FoldOptions & {
    readonly previews?: SessionPreviews;
}): void;
/** One event as a reader received it back: the record, and where its line put it. */
export interface ReceivedEvent {
    readonly type: string;
    readonly data?: unknown;
    readonly scope?: unknown;
    readonly meta: {
        readonly position: {
            readonly line: number;
            readonly index: number;
        };
        readonly at: string;
        readonly endOfLine?: boolean;
    };
}
/**
 * Folds events as a reader received them back, regrouped into their lines by position. A line
 * folds whole, once its last record has arrived: the events of a line still arriving are
 * returned unfolded, to pass again with the rest. Lines the view already folded are skipped, so
 * replayed overlap folds once.
 */
export declare function foldEvents<TEvent extends ReceivedEvent>(view: SessionView, events: readonly TEvent[], options?: FoldOptions & {
    readonly previews?: SessionPreviews;
}): readonly TEvent[];
/** The tables a complete read of `events` folds into, with each part's and call's previews. */
export declare function viewOfEvents(events: readonly ReceivedEvent[]): {
    readonly view: SessionView;
    readonly previews: SessionPreviews;
};
/**
 * A copy of a view that folding can change without changing `view`. Rows are replaced, never
 * edited, so copying the tables is enough: a reader that keeps every state, such as a UI's
 * reducer, copies before each fold instead of cloning every row.
 */
export declare function copyView(view: SessionView): SessionView;
/**
 * Folds one event as a reader received it, for a reader that updates on each event rather than
 * on each line. Facts apply in order within a line, so folding a line event by event leaves the
 * same tables; the view's position moves past the line with its last event. Events of a line
 * the view already passed are skipped.
 */
export declare function foldReceivedEvent(view: SessionView, event: {
    readonly type: string;
    readonly meta?: Partial<ReceivedEvent["meta"]>;
}, previews?: SessionPreviews): void;
