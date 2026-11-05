/**
 * Encoding of the per-run VM snapshots the QuickJS engine persists through
 * `world.experimental_snapshots` (compress, then encrypt on save; the inverse
 * on load), and the checks a stored snapshot must pass before its heap is
 * handed to the engine.
 *
 * A snapshot is executable state: bytecode, closures and pending
 * continuations that run with access to every host callback. So a load
 * treats storage as untrusted input:
 *
 * - The restore-relevant metadata is sealed INSIDE the encrypted payload,
 *   bound to the run id, and must equal the metadata the World returned.
 *   With an encryption key that makes the pairing authenticated: bytes from
 *   one snapshot can't be combined with another's metadata (a wrong cursor
 *   silently replays from the wrong log position), and nothing
 *   restore-relevant can be edited in the plaintext envelope. Without a key
 *   the same check still catches torn or mismatched writes.
 * - A run that has an encryption key only accepts encrypted snapshots, so a
 *   plaintext blob written to storage can't bypass encryption.
 * - Decompression is capped, so a small compressed blob can't inflate
 *   without bound.
 * - Numeric fields that drive host-side work before the VM exists (the PRNG
 *   fast-forward runs `rngDraws` synchronous draws) are bounded.
 */
import type { SnapshotMetadata } from '#compiled/@workflow/world/index.js';
import { type RunPayloadKeys } from '../serialization/encryption.js';
/**
 * Plaintext size ceiling for persisted VM snapshots. A heap beyond this
 * costs more to store, encrypt and decompress than the replay it saves.
 * Captures over it are not saved, and loads refuse to inflate past it.
 */
export declare const MAX_SNAPSHOT_PLAINTEXT_BYTES: number;
/**
 * Upper bound on `rngDraws` accepted from a stored snapshot. The restore
 * fast-forwards the run's PRNG that many draws synchronously before the VM
 * exists (about 70 ns per draw), so an unbounded value is a hang. A run that
 * legitimately drew more than this restores by full replay instead.
 */
export declare const MAX_SNAPSHOT_RNG_DRAWS = 10000000;
/** Why a stored snapshot was not restored. */
export type SnapshotRejectReason = 'unencrypted' | 'undecryptable' | 'too_large' | 'malformed' | 'metadata_mismatch' | 'out_of_bounds';
export declare class SnapshotRejectedError extends Error {
    readonly reason: SnapshotRejectReason;
    constructor(reason: SnapshotRejectReason, message: string);
}
/**
 * Bounds on metadata values the runtime acts on before it can validate the
 * heap itself. Checked on the World-supplied metadata before any decrypt or
 * decompress work, so an out-of-range value costs nothing.
 */
export declare function checkSnapshotMetadataBounds(metadata: SnapshotMetadata): string | undefined;
/**
 * Encode a captured heap for storage: frame it with its sealed metadata,
 * compress, then encrypt (ciphertext doesn't compress, so compression comes
 * first). Returns the bytes to hand to `experimental_snapshots.save`.
 */
export declare function sealSnapshot(params: {
    runId: string;
    heap: Uint8Array;
    metadata: SnapshotMetadata;
    encryptionKey: RunPayloadKeys | undefined;
}): Promise<Uint8Array>;
/**
 * Decode stored snapshot bytes back to the heap image, enforcing every
 * check in the module doc. Throws {@link SnapshotRejectedError}; the caller
 * treats that as a miss and falls back to full replay.
 */
export declare function openSnapshot(params: {
    runId: string;
    stored: Uint8Array;
    metadata: SnapshotMetadata;
    encryptionKey: RunPayloadKeys | undefined;
}): Promise<Uint8Array>;
//# sourceMappingURL=quickjs-snapshot-codec.d.ts.map