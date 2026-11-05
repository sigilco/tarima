import type { SessionView as Tables, SessionPreviews } from "./tables.js";
import type { ReceivedEvent } from "./fold.js";
declare const sessionViewBrand: unique symbol;
/** An immutable observation snapshot. Persist events and cursors, not its backing representation. */
export interface SessionView {
    readonly [sessionViewBrand]: true;
}
interface Snapshot {
    readonly tables: Tables;
    readonly previews: SessionPreviews;
    readonly pending: readonly ReceivedEvent[];
}
/** Internal publication boundary; rows are replaced by the fold and cloned at most once. */
export declare function snapshotOf(view: Tables, previews?: SessionPreviews, pending?: readonly ReceivedEvent[]): SessionView;
export declare function snapshotState(view: SessionView): Snapshot;
/** Private access for execution and built-in renderers, never exported by a public entry. */
export declare function sessionTables(view: SessionView): Tables;
export {};
