import type { StoredLine } from "#protocol/session-events/envelope.js";
import type { SessionEvent, SessionStreamEvent } from "#protocol/session-event.js";
/** True for a record this version knows: a v27 fact or progress type. */
export declare function isKnownRecordType(type: unknown): boolean;
/**
 * The lines one publication writes: each run of facts as one commit, each progress record as its
 * own line, in order.
 */
export declare function linesOf(events: readonly SessionEvent[], at: string): StoredLine<SessionEvent, SessionEvent>[];
/**
 * The events a line carries, each with its position and time; a progress record takes
 * `progressAt`, the time of the latest commit. Records of types this version doesn't know are
 * skipped, as every reader skips them.
 */
export declare function eventsOfLine(line: StoredLine, position: number, progressAt: string): SessionStreamEvent[];
/** Reads events from consecutive lines, keeping the time progress records inherit. */
export declare function createEventReader(progressAt?: string): {
    read(line: StoredLine, position: number): SessionStreamEvent[];
};
