/**
 * Capabilities table for workflow runs based on their `@workflow/core` version.
 *
 * When resuming a hook or webhook, the payload must be encoded in a format
 * that the *target* workflow run's deployment can decode. This module provides
 * a way to look up what serialization formats a given `@workflow/core` version
 * supports, so that newer deployments can avoid encoding payloads in formats
 * that older deployments don't understand (e.g., the `encr` encryption format).
 *
 * ## Adding a new format
 *
 * When a new serialization format is introduced:
 * 1. Add the format constant to `SerializationFormat` in `serialization.ts`
 * 2. Add an entry to `FORMAT_VERSION_TABLE` below with the minimum
 *    `@workflow/core` version that supports it
 * 3. The `getRunCapabilities()` function will automatically include it
 *
 * ## Adding a new non-format capability
 *
 * Some capabilities aren't serialization format prefixes: e.g.
 * byte-stream wire framing is an envelope around chunks rather than
 * a content format. For those, add a boolean field to `RunCapabilities`
 * and an entry in `CAPABILITY_VERSION_TABLE` below.
 *
 * ## History
 *
 * - `encr` (AES-256-GCM encryption): added in `4.2.0-beta.64`
 *   Commit: 7618ac36 "Wire AES-GCM encryption into serialization layer (#1251)"
 *   https://github.com/vercel/workflow/commit/7618ac36
 * - `framedByteStreams` (wire-level chunk framing for byte streams): added in `5.0.0-beta.15`
 * - `gzip` (gzip payload compression): added in `5.0.0-beta.18`
 * - `zstd` (zstd payload compression, preferred codec): added in `5.0.0-beta.18`
 *   alongside gzip. Unlike gzip, decoding zstd also depends on the runtime:
 *   `node:zlib` only has it from Node.js 22.15 / 23.8. A run therefore only
 *   counts as zstd-capable when its execution context records a `nodeVersion`
 *   that has it (see {@link nodeVersionSupportsZstd}). Runs created before
 *   that field existed get gzip, which every supported runtime decodes.
 * - `encp` (X25519 sealed-box encryption for cross-run writes): added in
 *   `5.0.0-beta.37`. Note that producers do **not** gate `encp` on this table:
 *   they gate on the presence of `encryptionPublicKey` on the target run,
 *   which a run only carries if the deployment that created it could also
 *   open `encp`. The entry exists so the capability set stays a complete,
 *   auditable description of a run's decoding ability.
 * - Hook-resume consumer protocol ("consumer re-ensures `hook_received` from
 *   `hookInput`"): deliberately NOT tracked here. Rather than predict a
 *   release cutoff, the run's creating deployment stamps an explicit
 *   `hookResumeInputVersion` execution-context marker (mirrored onto the
 *   hook's resumeContext by the server); older producers gate their lazy path
 *   on that marker.
 */
import type { CompressionMode } from './serialization/compression.js';
import { type SerializationFormatType } from './serialization.js';
/**
 * Capabilities of a workflow run based on its `@workflow/core` version.
 */
export interface RunCapabilities {
    /**
     * The set of serialization format prefixes that the target run can decode.
     * Use `supportedFormats.has(SerializationFormat.ENCRYPTED)` to check
     * if encryption is supported, etc.
     */
    supportedFormats: ReadonlySet<SerializationFormatType>;
    /**
     * Whether the target run can decode wire-framed byte streams. When true,
     * byte streams (`type: 'bytes'` ReadableStreams passed across boundaries)
     * are wrapped in a length-prefixed frame envelope on the wire so the
     * reader can identify chunk boundaries, which enables auto-reconnect
     * on transient stream errors. When false, byte streams are written as
     * raw bytes (the legacy format) for compatibility with older runs.
     */
    framedByteStreams: boolean;
    /** Whether real-time abort packets may carry a length envelope. */
    framedAbortStreams: boolean;
}
/**
 * Whether a run whose deployment runs this Node.js version can decode zstd
 * payloads. `undefined` (runs created before the version was recorded, or a
 * non-Node runtime) is treated as unable to.
 */
export declare function nodeVersionSupportsZstd(nodeVersion: string | undefined): boolean;
/**
 * The Node.js version of the current process, as recorded on the runs it
 * creates (`executionContext.nodeVersion`) and advertised in health-check
 * responses. `undefined` on runtimes that are not Node.js: Bun and Deno
 * expose `process.versions.node` for compatibility, but their `node:zlib`
 * support does not follow that version, so they must not claim it.
 */
export declare function getCurrentNodeVersion(): string | undefined;
/**
 * Look up what serialization capabilities a workflow run supports based on
 * its `@workflow/core` version string (from `executionContext.workflowCoreVersion`)
 * and the Node.js version of its deployment (from `executionContext.nodeVersion`).
 *
 * When the core version is `undefined`, not a string, or not a valid semver
 * string (e.g. older runs that predate the field, or corrupted metadata),
 * we assume the most conservative capabilities (baseline formats only,
 * non-format capabilities all `false`). When the Node.js version is unknown,
 * zstd is excluded.
 */
export declare function getRunCapabilities(workflowCoreVersion: string | undefined, nodeVersion?: string): RunCapabilities;
/**
 * The compression a write may apply for a target run with these
 * capabilities: any codec when it decodes zstd, gzip only when it decodes
 * just gzip, none otherwise. Callers still gate on the run's specVersion.
 */
export declare function getCompressionMode(capabilities: RunCapabilities): CompressionMode;
//# sourceMappingURL=capabilities.d.ts.map