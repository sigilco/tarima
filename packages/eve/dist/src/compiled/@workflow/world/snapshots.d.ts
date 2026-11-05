/**
 * VM snapshot storage types and helpers backing
 * `Storage.experimental_snapshots`.
 *
 * @experimental Everything exported from this module may change without a
 * major version bump. Worlds are not required to implement snapshot
 * storage.
 */
import { z } from '#compiled/zod/index.js';
/** @experimental See `Storage.experimental_snapshots`. */
export declare const SnapshotMetadataSchema: z.ZodObject<{
    eventsCursor: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodCoercedDate<unknown>;
    eventCount: z.ZodOptional<z.ZodNumber>;
    rngDraws: z.ZodOptional<z.ZodNumber>;
    serdeRootPtr: z.ZodOptional<z.ZodNumber>;
    lastUlid: z.ZodOptional<z.ZodString>;
    engineVersion: z.ZodOptional<z.ZodString>;
    clockMs: z.ZodOptional<z.ZodNumber>;
    formatVersion: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Current snapshot format version, bumped when the heap layout or the
 * metadata contract changes incompatibly.
 *
 * v2: host-side serde + host-side ULID factory (post-#3263 engine) —
 * adds required `serdeRootPtr` and `lastUlid` continuation state. v1
 * snapshots (in-VM serde era) cannot be restored by this engine and are
 * treated as a miss.
 *
 * v3: the stored bytes frame the heap with the restore-relevant metadata,
 * sealed inside the encryption so it can be checked against the envelope
 * on load, and the heap stops retaining consumed step results. v2
 * snapshots are treated as a miss.
 *
 * v4: the heap releases settled pending operations (keyed in a Map instead
 * of an append-only array). v3 heaps carry the old bookkeeping layout and
 * are treated as a miss.
 *
 * @experimental See `Storage.experimental_snapshots`.
 */
export declare const SNAPSHOT_FORMAT_VERSION = 4;
/** @experimental See `Storage.experimental_snapshots`. */
export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;
/**
 * Encode a snapshot's metadata and bytes into one atomic blob.
 *
 * @experimental See `Storage.experimental_snapshots`.
 */
export declare function encodeSnapshotEnvelope(metadata: SnapshotMetadata, data: Uint8Array): Uint8Array;
/**
 * Decode a snapshot envelope. Returns null for anything that is not a
 * well-formed, schema-valid envelope (wrong magic, unknown version,
 * truncated, invalid JSON, schema violation) — the caller treats that as
 * a clean miss (full replay) rather than restoring from fabricated or
 * torn state. Never invents metadata.
 *
 * @experimental See `Storage.experimental_snapshots`.
 */
export declare function decodeSnapshotEnvelope(bytes: Uint8Array): {
    metadata: SnapshotMetadata;
    data: Uint8Array;
} | null;
//# sourceMappingURL=snapshots.d.ts.map