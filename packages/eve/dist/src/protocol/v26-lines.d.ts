/**
 * True for a record an eve before v27 stored: a v26 `{type, data, meta}` event. No v27 line has a
 * top-level `type`, so a stream whose first line is one was started by an earlier eve.
 */
export declare function isV26Line(record: unknown): boolean;
