import type { SessionPublication } from "#harness/types.js";
import type { SessionEvent } from "#protocol/session-event.js";
import { type StoredLine } from "#protocol/session-events/envelope.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
/** One line a publication writes, encoded, at the position it takes. */
export interface CommittedLine {
    readonly line: StoredLine<SessionEvent, SessionEvent>;
    readonly bytes: Uint8Array;
    readonly position: number;
}
export interface LineCommitter {
    /**
     * The lines `publication` writes over `view`, from `position`. Throws on a violation, before
     * any line is written: an oversize or invalid line must not leave part of a commit behind.
     */
    commit(view: SessionView, publication: SessionPublication, position: number, at?: string): readonly CommittedLine[];
    /** A write failed: the committer forgets what it checked, and reseeds from the next view. */
    reset(): void;
}
/** A committer for one writer, which checks each line against the lines before it. */
export declare function createLineCommitter(): Promise<LineCommitter>;
