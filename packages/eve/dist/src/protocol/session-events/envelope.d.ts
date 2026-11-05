/**
 * One line of a session stream: a commit, which holds every fact of one transition, or one
 * progress record. A line's zero-based index in the stream is its position, and its identity.
 */
export type StoredLine<TFact = unknown, TProgress = unknown> = CommitLine<TFact> | ProgressLine<TProgress>;
/** Every fact one transition recorded, in order, with the time the writer wrote them. */
export interface CommitLine<TFact = unknown> {
    /** When the writer wrote the line, as ISO 8601 in UTC. For display and durations, never order. */
    readonly at: string;
    /** Never empty. A fact may reference an entity an earlier fact in the same line introduced. */
    readonly facts: readonly TFact[];
}
/** A preview of a value a later fact completes. Any progress record may be missing. */
export interface ProgressLine<TProgress = unknown> {
    readonly progress: TProgress;
}
/**
 * The owners a fact belongs to, stamped by the publisher. Owners never change, so a scope never
 * goes stale; readers that don't fold use it to place a fact.
 */
export interface Scope {
    readonly turnId?: string;
    readonly taskId?: string;
    readonly runId?: string;
    readonly changeId?: string;
}
/** A fact or progress record: its type (`family.verb`), its owners, and its payload. */
export interface Envelope<TType extends string, TData> {
    readonly type: TType;
    readonly scope?: Scope;
    readonly data: TData;
}
/**
 * Records the stream route writes into a response. They are never stored and never counted, and
 * readers ignore the ones they don't know.
 */
export type TransportRecord = PositionMarker | {
    readonly $eve: "heartbeat";
} | {
    readonly $eve: "stream.lease-ended";
} | {
    readonly $eve: "stream.ended";
};
/** Written after lines a read skipped: the position of the next line the response sends. */
export interface PositionMarker {
    readonly $eve: "position";
    readonly next: number;
}
export declare const HEARTBEAT_RECORD: {
    readonly $eve: "heartbeat";
};
export declare const LEASE_ENDED_RECORD: {
    readonly $eve: "stream.lease-ended";
};
export declare const STREAM_ENDED_RECORD: {
    readonly $eve: "stream.ended";
};
/** Where one fact or progress record sits: its line's position, and its index in the line. */
export interface FactPosition {
    readonly line: number;
    readonly index: number;
}
/** What one record read from a response is. */
export type ReadRecord<TFact = unknown, TProgress = unknown> = {
    readonly kind: "commit";
    readonly line: CommitLine<TFact>;
} | {
    readonly kind: "progress";
    readonly line: ProgressLine<TProgress>;
} | {
    readonly kind: "transport";
    readonly record: TransportRecord;
} | {
    readonly kind: "unknown-transport";
    readonly name: string;
} | {
    readonly kind: "invalid";
    readonly value: unknown;
};
/** Tells the kinds of record apart by key, as every reader does. */
export declare function classifyRecord<TFact = unknown, TProgress = unknown>(value: unknown): ReadRecord<TFact, TProgress>;
/** True for a stored line: a commit or a progress record. */
export declare function isStoredLine(value: unknown): value is StoredLine;
/** Encodes one stored line as NDJSON. */
export declare function encodeLine(line: StoredLine | TransportRecord): string;
/** Below the workflow writer's 10 MiB per-chunk ceiling, including UTF-8 and the newline. */
export declare const MAX_SESSION_LINE_BYTES: number;
export declare class SessionLineTooLargeError extends Error {
    readonly bytes: number;
    constructor(bytes: number);
}
/** Encodes one atomic chunk, refusing oversized lines before a durable write. */
export declare function encodeLineBytes(line: StoredLine | TransportRecord): Uint8Array;
/**
 * What caused something, by the entity that did. The set is open: a reader that meets a cause it
 * doesn't know treats it as the system's.
 */
export type Cause = {
    readonly deliveryId: string;
} | {
    readonly turnId: string;
} | {
    readonly taskId: string;
} | {
    readonly callId: string;
} | {
    readonly interactionId: string;
} | {
    readonly responseId: string;
} | {
    readonly changeId: string;
} | {
    readonly policy: string;
} | {
    readonly hook: string;
};
/** Who submitted a delivery, as its channel authenticated them. */
export interface Principal {
    readonly id: string;
    /** Open: `"user"` and `"app"` today. */
    readonly type: string;
    readonly issuer?: string;
}
/** A failure's code and its human-readable message. Codes are open strings. */
export interface ErrorInfo {
    /** The thrown error's class name, when a producer knows it. */
    readonly name?: string;
    readonly code: string;
    readonly message: string;
    /** An id to quote when asking for support; the server's logs carry the same id. */
    readonly id?: string;
    /** What to do about it, when eve recognizes the failure: a person-facing remedy. */
    readonly hint?: string;
}
/** Tokens and cost one unit of work spent. */
export interface Usage {
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly cacheReadTokens: number;
    readonly cacheWriteTokens: number;
    /** Absent when the provider reported no cost. */
    readonly costUsd?: number;
}
/**
 * A value carried by reference instead of inline: too large for a line, or withheld. A field
 * that may be large has an inline slot and a `…Ref` slot, so absent, inline, referenced, and
 * withheld values stay distinct.
 */
export interface ValueReference {
    /** Resolved through a session-scoped route. Absent when the value is withheld. */
    readonly ref?: string;
    readonly mediaType?: string;
    readonly size?: number;
    /** A short preview for display. */
    readonly preview?: string;
    /** The value exists but isn't published. */
    readonly withheld?: true;
}
/** Any JSON value. */
export type { JsonValue } from "./json.js";
/** One part of what a person sent. The kind set is open. */
export type UserPart = {
    readonly kind: "text";
    readonly text: string;
} | {
    readonly kind: "file";
    readonly mediaType: string;
    readonly filename?: string;
    readonly size?: number;
    /** Absent with `unavailable` when no store holds the file. */
    readonly ref?: string;
    readonly url?: string;
    readonly unavailable?: true;
};
