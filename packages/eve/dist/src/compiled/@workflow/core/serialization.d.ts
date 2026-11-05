import { createFlushableState, type FlushableStreamState } from './flushable-stream.js';
import { type CompressionMode, compress, decompress } from './serialization/compression.js';
import { aesKeyOf, decrypt, deriveRunPayloadKeys, type EncryptionKeyParam, encrypt, isRunPayloadKeys, isSealTarget, type PayloadKey, type RunPayloadKeys, runPayloadKeys, type SealTarget, sealTo } from './serialization/encryption.js';
import { decodeFormatPrefix, encodeWithFormatPrefix, isEncrypted, peekFormatPrefix } from './serialization/format.js';
import { type GuestCodeStats } from './serialization/hardened.js';
import { type FormatPrefix, isFormatPrefix, SerializationFormat } from './serialization/types.js';
export { SerializationFormat, type FormatPrefix, isFormatPrefix, encodeWithFormatPrefix, decodeFormatPrefix, peekFormatPrefix, isEncrypted, encrypt, decrypt, compress, decompress, type EncryptionKeyParam, type PayloadKey, type RunPayloadKeys, type SealTarget, sealTo, runPayloadKeys, deriveRunPayloadKeys, isSealTarget, isRunPayloadKeys, aesKeyOf, };
export type SerializationFormatType = (typeof SerializationFormat)[keyof typeof SerializationFormat];
/**
 * Detect if a readable stream is a byte stream.
 *
 * @param stream
 * @returns `"bytes"` if the stream is a byte stream, `undefined` otherwise
 */
export declare function getStreamType(stream: ReadableStream): 'bytes' | undefined;
export declare function getSerializeStream(reducers: Partial<Reducers>, cryptoKey: EncryptionKeyParam): TransformStream<any, Uint8Array>;
export declare function getDeserializeStream(revivers: Partial<Revivers>, cryptoKey: EncryptionKeyParam): TransformStream<Uint8Array, any>;
/**
 * Wraps each chunk of a byte stream in a 4-byte big-endian length
 * prefix. Used by the producer side of a framed byte-stream pipe.
 *
 * Empty chunks (length 0) are dropped: the resulting `[0x00 0x00 0x00 0x00]`
 * frame would be ambiguous with the legacy "looks framed" detection in
 * `getDeserializeStream`, and it carries no information.
 *
 * Load-bearing invariant: each user chunk becomes exactly one frame, and
 * each frame is enqueued as exactly one transport chunk (the downstream
 * writable performs one wire write per chunk, preserving boundaries). The
 * server therefore stores one frame per chunk index, which is what allows
 * a future reconnecting reader to resume a framed byte stream at
 * `startIndex + consumedFrames`, the same arithmetic
 * `createReconnectingFramedStream` relies on for object streams. Do not
 * coalesce or split frames here without revisiting that resume logic.
 */
export declare function getByteFramingStream(): TransformStream<Uint8Array, Uint8Array>;
/**
 * Unwraps length-prefixed byte-stream frames back into the original user
 * chunks. Used by the consumer side of a framed byte-stream pipe.
 *
 * Buffers across read boundaries, since the transport may split a single
 * frame across multiple reads (header in one chunk, payload in another)
 * or coalesce multiple frames into a single read. The transform emits
 * whole user chunks regardless of transport chunking.
 *
 * Errors the stream if the length header advertises a frame larger than
 * `MAX_FRAME_SIZE` bytes, since that almost certainly indicates a
 * misframed wire (e.g. a raw byte stream being fed through this transform
 * by mistake) and we don't want to allocate an enormous buffer.
 */
export declare function getByteUnframingStream(): TransformStream<Uint8Array, Uint8Array>;
export declare class WorkflowServerReadableStream extends ReadableStream<Uint8Array> {
    #private;
    constructor(runId: string, name: string, startIndex?: number);
}
/**
 * Maximum consecutive reconnect attempts for a single framed stream session.
 * The counter resets to zero whenever a reconnect makes forward progress (a
 * frame is delivered), so this bounds *consecutive* failures, not the lifetime
 * total: a long-lived serverless stream may legitimately reconnect far more
 * than this many times as long as each reconnect keeps delivering data. We only
 * give up after this many reconnects in a row produce nothing.
 */
export declare const FRAMED_STREAM_MAX_RECONNECTS = 50;
/**
 * Absolute backstop on total reconnects for a single session, independent of
 * progress. The consecutive cap above resets on forward progress, which is
 * correct for a well-behaved backend that honors `startIndex`. But if a World's
 * `streams.get` ever ignored `startIndex` and re-delivered earlier chunks,
 * "progress" would be reported every reconnect and the consecutive cap would
 * never trip, turning a bounded failure into an unbounded reconnect loop. This
 * hard ceiling guarantees the loop always terminates. It is set high enough
 * (hours of streaming at realistic per-session timeouts) to never interfere
 * with legitimate long-lived streams.
 */
export declare const FRAMED_STREAM_MAX_TOTAL_RECONNECTS = 1000;
/**
 * Wraps the length-prefix-framed byte stream from `world.streams.get` with
 * transparent auto-reconnect.
 *
 * Every fully-decoded outer frame corresponds to exactly one server-side
 * chunk (the serialize transform enqueues one frame per workflow write, and
 * the writable buffers one frame per chunk when multi-writing). The wrapper
 * counts completed frames and, on upstream error, reopens the connection
 * with `startIndex = resolvedStartIndex + consumedFrames`. Partial-frame
 * bytes buffered before the cut are discarded; the server will resend the
 * in-flight chunk in full from the new startIndex.
 *
 * A clean upstream close (EOF with no error) is NOT trusted as completion
 * on its own: some transport paths normalize a mid-stream abort into a
 * graceful end (observed in production on Vercel response streaming, where
 * the server's max-duration abort arrives at the client as a clean EOF).
 * On EOF the wrapper verifies against the stream's authoritative metadata
 * (`streams.getInfo`) that the stream is complete AND that every chunk up to
 * `done` was delivered; otherwise it reconnects from the next chunk exactly
 * like an errored connection. If the metadata read itself fails, the EOF is
 * trusted (legacy behavior) rather than failing a read that may well be
 * complete.
 *
 * Negative `startIndex` values (last-N semantics) skip the reconnect
 * machinery because we cannot compute an absolute resume position without
 * a tail-index lookup; the returned stream behaves as a single-shot read.
 */
export declare function createReconnectingFramedStream(runId: string, name: string, startIndex?: number, prefetchEncryptionKey?: () => Promise<PayloadKey | undefined>): ReadableStream<Uint8Array>;
export declare class WorkflowServerWritableStream extends WritableStream<Uint8Array> {
    /**
     * @param runReadyBarrier Turbo mode only: a promise that resolves once the
     * backgrounded `run_started` has landed. When the step body runs
     * optimistically (before `run_started` is durable), the first chunk write to
     * a brand-new stream would otherwise reach the World before the run exists
     * and be rejected as run-not-found. Awaiting this once before the first
     * flush/close orders the write after the run's creation. If it rejects,
     * every write and the close fail with its error instead of reaching the
     * World: a refused `run_started` can mean another orchestrator holds the
     * run, and this body's chunks would land on a stream whose run never
     * records the step that wrote them. `undefined` outside turbo and on the
     * await path, where the run was already durable.
     */
    constructor(runId: string, name: string, runReadyBarrier?: Promise<unknown>);
}
export type { ByteStreamFraming, Reducers, Revivers, SerializableSpecial, } from './serialization/types.js';
import type { ByteStreamFraming, Reducers, Revivers } from './serialization/types.js';
/**
 * Reducers for serialization boundary from the client side, passing arguments
 * to the workflow handler.
 *
 * @param global
 * @param ops
 * @param runId
 * @param cryptoKey
 * @param framedByteStreams - When `true`, byte streams (`type: 'bytes'`)
 *   are wrapped in length-prefixed frames on the wire so the consumer
 *   can reconnect on transient errors. Should match the target run's
 *   capability: see `getRunCapabilities` in `capabilities.ts`. Defaults
 *   to `false` for backwards compatibility with older runs.
 * @returns
 */
export declare function getExternalReducers(global: Record<string, any> | undefined, ops: Promise<void>[], runId: string, cryptoKey: EncryptionKeyParam, framedByteStreams?: boolean, runReadyBarrier?: Promise<unknown>, readbackOps?: Promise<void>[], framedAbortStreams?: boolean, streamStartGate?: Promise<boolean>): Partial<Reducers>;
export declare function getWorkflowReducers(global?: Record<string, any>): Partial<Reducers>;
/**
 * Cancel dangling abort-stream readers on any AbortController instances found
 * in the hydrated step arguments. Called after the step function returns
 * (success or failure) to prevent reader promises from keeping the serverless
 * function alive indefinitely.
 */
export declare function cancelAbortReaders(...values: unknown[]): void;
/**
 * Base revivers shared across all serialization boundaries.
 * Composes: class + common revivers from the modular modules.
 *
 * This is exported because serialization-format.ts and other files reference it.
 */
export declare function getCommonRevivers(global?: Record<string, any>): {
    ArrayBuffer?: ((value: string) => any) | undefined;
    BigInt?: ((value: string) => any) | undefined;
    BigInt64Array?: ((value: string) => any) | undefined;
    BigUint64Array?: ((value: string) => any) | undefined;
    DataViewBytes?: ((value: string) => any) | undefined;
    Date?: ((value: string) => any) | undefined;
    DOMException?: ((value: {
        message: string;
        name: string;
        stack?: string;
        cause?: unknown;
    }) => any) | undefined;
    FatalError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
    }) => any) | undefined;
    Float32Array?: ((value: string) => any) | undefined;
    Float64Array?: ((value: string) => any) | undefined;
    Error?: ((value: {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    }) => any) | undefined;
    EvalError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
    }) => any) | undefined;
    Headers?: ((value: [string, string][]) => any) | undefined;
    HookConflictError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
        token: string;
        conflictingRunId?: string;
        kind?: "start";
    }) => any) | undefined;
    HookForceClaimedError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
        token: string;
        claimedByRunId: string;
        claimedByHookId?: string;
    }) => any) | undefined;
    WorkflowStartError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
        runId: string;
        stage: import("#compiled/@workflow/errors/index.js").WorkflowStartStage;
    }) => any) | undefined;
    Int8Array?: ((value: string) => any) | undefined;
    Int16Array?: ((value: string) => any) | undefined;
    Int32Array?: ((value: string) => any) | undefined;
    Map?: ((value: [any, any][]) => any) | undefined;
    RangeError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
    }) => any) | undefined;
    ReadableStream?: ((value: {
        name: string;
        type?: "bytes";
        startIndex?: number;
        framing?: ByteStreamFraming;
    } | {
        bodyInit: any;
    }) => any) | undefined;
    ReferenceError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
    }) => any) | undefined;
    RegExp?: ((value: {
        source: string;
        flags: string;
    }) => any) | undefined;
    RetryableError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
        retryAfter: number;
    }) => any) | undefined;
    RuntimeDecryptionError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
        context?: import("#compiled/@workflow/errors/index.js").RuntimeDecryptionErrorContext;
    }) => any) | undefined;
    StreamError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
        status?: number;
        url?: string;
    }) => any) | undefined;
    Request?: ((value: {
        method: string;
        url: string;
        headers: Headers;
        body: Request["body"];
        duplex: "half";
        responseWritable?: WritableStream<Response>;
        signal?: AbortSignal;
    }) => any) | undefined;
    Response?: ((value: {
        type: Response["type"];
        url: string;
        status: number;
        statusText: string;
        headers: Headers;
        body: Response["body"];
        redirected: boolean;
    }) => any) | undefined;
    Class?: ((value: {
        classId: string;
    }) => any) | undefined;
    Instance?: ((value: {
        classId: string;
        data: unknown;
    }) => any) | undefined;
    Set?: ((value: any[]) => any) | undefined;
    SyntaxError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
    }) => any) | undefined;
    StepFunction?: ((value: {
        stepId: string;
        closureVars?: Record<string, any>;
        boundThis?: unknown;
        boundArgs?: unknown[];
    }) => any) | undefined;
    TypeError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
    }) => any) | undefined;
    URIError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
    }) => any) | undefined;
    URL?: ((value: string) => any) | undefined;
    WorkflowFunction?: ((value: {
        workflowId: string;
    }) => any) | undefined;
    URLSearchParams?: ((value: string) => any) | undefined;
    Uint8Array?: ((value: string) => any) | undefined;
    Uint8ClampedArray?: ((value: string) => any) | undefined;
    Uint16Array?: ((value: string) => any) | undefined;
    Uint32Array?: ((value: string) => any) | undefined;
    AggregateError?: ((value: {
        message: string;
        stack?: string;
        cause?: unknown;
        errors: unknown[];
    }) => any) | undefined;
    WritableStream?: ((value: {
        name: string;
        runId?: string;
        deploymentId?: string;
        encryptionPublicKey?: string;
    }) => any) | undefined;
    AbortController?: ((value: {
        streamName: string;
        hookToken: string;
        aborted: boolean;
        reason?: unknown;
    }) => any) | undefined;
    AbortSignal?: ((value: {
        streamName: string;
        hookToken: string;
        aborted: boolean;
        reason?: unknown;
    }) => any) | undefined;
};
/**
 * Resolves the owner's encryption key, preferring its public key, then its
 * deployment, and finally the deployment on its run record.
 * @internal
 */
export declare function getForwardedWritableEncryptionKey(runId: string, deploymentId: string | undefined, encryptionPublicKey: string | undefined): Promise<PayloadKey | undefined>;
/** Tags a forwarded writable with its owner's metadata. @internal */
export declare function tagForwardedWritableTarget(writable: WritableStream, { deploymentId, encryptionPublicKey, }: {
    deploymentId?: string;
    encryptionPublicKey?: string;
}): void;
/** Creates and tags a forwarded writable targeting the owner run. @internal */
export declare function createForwardedWritable<W = any>({ global, ops, runId, name, key, deploymentId, encryptionPublicKey, runReadyBarrier, }: {
    global: Record<string, any>;
    ops: Promise<any>[];
    runId: string;
    name: string;
    key: EncryptionKeyParam;
    deploymentId?: string;
    encryptionPublicKey?: string;
    runReadyBarrier?: Promise<unknown>;
}): WritableStream<W>;
/**
 * Create a run's object readable without dispatching its stream GET or
 * encryption-key lookup until the caller reads it. The external reviver starts
 * its background pipe immediately, so this boundary belongs here—next to the
 * source/transform assembly—rather than in `Run`.
 *
 * @internal
 */
export declare function getRunReadableStream<T>(global: Record<string, any>, ops: Promise<void>[], runId: string, name: string, startIndex: number | undefined, cryptoKey: EncryptionKeyParam): ReadableStream<T>;
/** Options for external hydration. Defaults preserve live, eager hydration. @internal */
type ExternalReviverOptions = {
    /**
     * Defer readable stream I/O until consumption, including nested streams.
     * Writable streams still construct their forwarding pipe and lock poller
     * during hydration; callers must drain `ops` even for unused writables.
     */
    lazyStreams?: boolean;
    /** Set false for terminal reporting: revive only the persisted abort snapshot. */
    liveAbortSignals?: boolean;
    /** Receives completion state when a wrapper owns the public readable. */
    onReadableState?: (state: ReturnType<typeof createFlushableState>) => void;
};
/**
 * Revivers for deserialization boundary from the client side,
 * receiving the return value from the workflow handler.
 *
 * @param global
 * @param ops
 * @param runId
 */
export declare function getExternalRevivers(global: Record<string, any> | undefined, ops: Promise<void>[], runId: string, cryptoKey: EncryptionKeyParam, options?: ExternalReviverOptions): Partial<Revivers>;
/**
 * Revivers for deserialization boundary from within the workflow execution
 * environment, receiving arguments from the client side, and return values
 * from the steps.
 *
 * @param global
 * @returns
 */
export declare function getWorkflowRevivers(global?: Record<string, any>): Partial<Revivers>;
/**
 * Encrypt data if the world supports encryption.
 * Returns original data if encryption is not available.
 *
 * @deprecated Use `encrypt` from `./serialization/encryption.js` instead.
 */
export declare function maybeEncrypt(data: Uint8Array, key: PayloadKey | undefined): Promise<Uint8Array>;
/**
 * Decrypt data if it has the 'encr' prefix.
 *
 * @deprecated Use `decrypt` from `./serialization/encryption.js` instead.
 */
export declare function maybeDecrypt(data: Uint8Array | unknown, key: PayloadKey | undefined): Promise<Uint8Array | unknown>;
/**
 * Replay hydration has two stages:
 *
 * 1. Host-side preparation decrypts and decompresses persisted data. That work
 *    is independent of a workflow VM and can be cached across replay VMs.
 * 2. Deserialization revives the prepared representation against the current
 *    VM's globals. It must run again for every VM to produce fresh object graphs
 *    and correctly scoped Workflow objects.
 *
 * `data` is the boundary between those stages. For current-format payloads it
 * is still format-prefixed serialized bytes, not a live JavaScript value.
 */
export interface PreparedReplayPayload {
    readonly data: unknown;
}
/**
 * Swappable implementation of the host-side preparation stage. Supporting
 * both direct and promised results lets a future synchronous Node decryptor use
 * the same cache contract as today's asynchronous Web Crypto implementation.
 */
export type ReplayPayloadPreparer = (value: unknown, key: PayloadKey | undefined) => PreparedReplayPayload | Promise<PreparedReplayPayload>;
/**
 * Decrypt and decompress persisted data without parsing it into JavaScript.
 * Legacy non-binary values pass through unchanged for their consumer to revive.
 */
export declare const prepareReplayPayload: ReplayPayloadPreparer;
/**
 * Parse a prepared workflow argument or successful step/hook payload using the
 * current workflow VM's globals and revivers. Each call intentionally creates
 * a fresh object graph so mutations cannot leak across replay iterations.
 */
export declare function deserializePreparedReplayPayload(prepared: PreparedReplayPayload, global?: Record<string, any>, extraRevivers?: Record<string, (value: any) => any>): any;
/**
 * Parse a prepared step error using the current workflow VM's class revivers.
 * This preserves thrown-value identity without sharing objects between VMs.
 */
export declare function deserializePreparedStepError(prepared: PreparedReplayPayload, global?: Record<string, any>, extraRevivers?: Record<string, (value: any) => any>): unknown;
/**
 * Called from the `start()` function to serialize the workflow arguments
 * into a format that can be saved to the database and then hydrated from
 * within the workflow execution environment.
 *
 * @param value - The value to serialize
 * @param runId - The workflow run ID (required for encryption context)
 * @param key - Encryption key (undefined to skip encryption)
 * @param ops - Promise array for stream operations
 * @param global - Global object for serialization context
 * @param v1Compat - Enable legacy v1 compatibility mode
 * @param framedByteStreams - Whether the target run can decode wire-framed
 *   byte streams. Should match the target deployment's capability: see
 *   `getRunCapabilities` in `capabilities.ts`. Defaults to `false` for
 *   backwards compatibility with older runs.
 * @param framedAbortStreams - Whether the target deployment supports length-framed
 *   abort packets. Unknown/older targets must retain the unframed format.
 * @returns The dehydrated value as binary data (Uint8Array) with format prefix
 */
export declare function dehydrateWorkflowArguments(value: unknown, runId: string, key: PayloadKey | undefined, ops?: Promise<void>[], global?: Record<string, any>, v1Compat?: boolean, framedByteStreams?: boolean, compression?: CompressionMode, readbackOps?: Promise<void>[], framedAbortStreams?: boolean, streamStartGate?: Promise<boolean>): Promise<Uint8Array | unknown>;
/**
 * Called from workflow execution environment to hydrate the workflow
 * arguments from the database at the start of workflow execution. A prepared
 * payload skips host-side decrypt/decompress but always performs VM revival.
 */
export declare function hydrateWorkflowArguments(value: Uint8Array | unknown, _runId: string, key: PayloadKey | undefined, global?: Record<string, any>, extraRevivers?: Record<string, (value: any) => any>, prepared?: PreparedReplayPayload): Promise<any>;
/**
 * Dehydrate workflow return value for storage.
 */
export declare function dehydrateWorkflowReturnValue(value: unknown, _runId: string, key: PayloadKey | undefined, global?: Record<string, any>, v1Compat?: boolean, compression?: CompressionMode, 
/**
 * Optional sink receiving the first five samples and exact total count of
 * workflow-code executions serialization could not avoid. The diagnostics
 * are emitted as span attributes either way, so omitting this loses nothing
 * observability-wise. The retained-VM gate in runtime/suspension-handler.ts
 * passes one for step-input dehydration.
 */
guestCodeStatsOut?: GuestCodeStats): Promise<Uint8Array | unknown>;
/**
 * Called from the client side to hydrate the workflow return value
 * of a completed workflow run.
 */
export declare function hydrateWorkflowReturnValue(value: Uint8Array | unknown, runId: string, key: PayloadKey | undefined, ops?: Promise<void>[], global?: Record<string, any>, extraRevivers?: Record<string, (value: any) => any>): Promise<any>;
/**
 * Called from the workflow handler when a step is being created.
 * Dehydrates values from within the workflow execution environment.
 */
export declare function dehydrateStepArguments(value: unknown, _runId: string, key: PayloadKey | undefined, global?: Record<string, any>, v1Compat?: boolean, compression?: CompressionMode, 
/** See `dehydrateWorkflowReturnValue`. */
guestCodeStatsOut?: GuestCodeStats): Promise<Uint8Array | unknown>;
/**
 * Called from the step executor to hydrate the arguments of a step
 * from the database at the start of the step execution.
 */
export declare function hydrateStepArguments(value: Uint8Array | unknown, runId: string, key: PayloadKey | undefined, ops?: Promise<any>[], global?: Record<string, any>, extraRevivers?: Record<string, (value: any) => any>, deploymentId?: string, streamStates?: FlushableStreamState[], runReadyBarrier?: Promise<unknown>): Promise<any>;
/**
 * Called from the step executor when a step has completed.
 * Dehydrates values from within the step execution environment
 * into a format that can be saved to the database.
 *
 * @param value - The value to serialize
 * @param runId - Run ID for encryption context
 * @param key - Encryption key (undefined to skip encryption)
 * @param ops - Promise array for stream operations
 * @param global - Global object for serialization context
 * @param v1Compat - Enable legacy v1 compatibility mode
 * @param framedByteStreams - Whether the target run can decode wire-framed
 *   byte streams. Should match the target deployment's capability: see
 *   `getRunCapabilities` in `capabilities.ts`. Defaults to `false` for
 *   backwards compatibility with older runs.
 * @param framedAbortStreams - Whether the target deployment supports length-framed
 *   abort packets. Unknown/older targets must retain the unframed format.
 * @returns The dehydrated value as binary data (Uint8Array) with format prefix
 */
export declare function dehydrateStepReturnValue(value: unknown, runId: string, key: PayloadKey | undefined, ops?: Promise<any>[], global?: Record<string, any>, v1Compat?: boolean, framedByteStreams?: boolean, compression?: CompressionMode, runReadyBarrier?: Promise<unknown>, readbackOps?: Promise<void>[], framedAbortStreams?: boolean): Promise<Uint8Array | unknown>;
/**
 * Called from the step executor when a step throws. Dehydrates the thrown
 * value from within the step execution environment into a format that can
 * be saved to the database in a `step_failed` or `step_retrying` event.
 *
 * Any JavaScript value can be thrown (strings, numbers, objects, Errors,
 * Error subclasses), so the same serialization pipeline used for step
 * arguments and return values is applied here.
 *
 * @param value - The thrown value to serialize (can be any type)
 * @param runId - Run ID for encryption context
 * @param key - Encryption key (undefined to skip encryption)
 * @param ops - Promise array for stream operations
 * @param global - Global object for serialization context
 * @returns The dehydrated value as binary data (Uint8Array) with format prefix
 */
export declare function dehydrateStepError(value: unknown, runId: string, key: PayloadKey | undefined, ops?: Promise<any>[], global?: Record<string, any>, compression?: CompressionMode): Promise<Uint8Array>;
/**
 * Called from the workflow handler when replaying the event log of a
 * `step_failed` or `step_retrying` event. Hydrates the thrown value from
 * the database so the workflow can see the original thrown value.
 *
 * @param value - Binary serialized data (Uint8Array) with format prefix
 * @param runId - Run ID for decryption context
 * @param key - Encryption key (undefined to skip decryption)
 * @param global - Global object for deserialization context
 * @param extraRevivers - Additional revivers for custom types
 * @param prepared - Optional cached decrypt/decompress result
 * @returns The hydrated thrown value, ready to reject the step promise
 */
export declare function hydrateStepError(value: Uint8Array | unknown, _runId: string, key: PayloadKey | undefined, global?: Record<string, any>, extraRevivers?: Record<string, (value: any) => any>, prepared?: PreparedReplayPayload): Promise<unknown>;
/**
 * Serialize a dynamic run's generated workflow VM code for storage.
 *
 * Dynamic workflow code is application source, so it gets the same treatment
 * as any other run payload: compressed (it is plain text, which compresses
 * very well), then encrypted with the run's key. At rest it is opaque
 * ciphertext, which is the point — generated orchestration can name internal
 * step ids, prompts, and business rules, and observability surfaces must not
 * read it without going through the decrypt flow.
 *
 * The code is a plain string, so it needs none of the reducers the other
 * payloads go through, but it is still written as real devalue under the
 * `DEVALUE_V1` prefix: the generic hydrators (`hydrateData` behind the CLI
 * and the observability UI) trust that prefix and hand the bytes to
 * devalue's `parse`, which rejects a bare JSON string as invalid input.
 *
 * @param code - Generated workflow VM code.
 * @param key - Encryption key (undefined to skip encryption).
 * @param compression - Whether the target run may carry compressed payloads.
 */
export declare function dehydrateDynamicWorkflowCode(code: string, key: PayloadKey | undefined, compression?: CompressionMode): Promise<Uint8Array>;
/**
 * Hydrate a dynamic run's workflow VM code back into source, on the replay
 * path.
 *
 * When the run has key material, or its execution context records that it was
 * started with encryption, only the symmetric `encr` envelope is accepted.
 * Plaintext would let anyone who can write the run record supply code, and a
 * sealed `encp` envelope can be produced by anyone holding the run's public
 * key, so neither is evidence that the run's own key encrypted it. This gives
 * confidentiality and narrows who can supply code; it is not an integrity
 * guarantee against a holder of the run key.
 *
 * Without key material (Worlds with no encryption), plaintext is accepted.
 *
 * @param value - Stored bytes from the run's `dynamicWorkflowCode`.
 * @param key - Encryption key (undefined when encryption is disabled).
 * @param options.encryptionRequired - The run was started with encryption
 *   (`executionContext.features.encryption`), so plaintext is refused even
 *   when no key was resolved.
 * @throws SerializationError when the payload is not `encr` although
 *   encryption is required, or does not decode to a string: a corrupted or
 *   foreign payload must not reach the workflow VM as code.
 */
export declare function hydrateDynamicWorkflowCode(value: Uint8Array | unknown, key: PayloadKey | undefined, options?: {
    encryptionRequired?: boolean;
}): Promise<string>;
/**
 * Called from the workflow handler when the workflow itself throws.
 * Dehydrates the thrown value from within the workflow execution environment
 * into a format that can be saved to the database in a `run_failed` event.
 *
 * @param value - The thrown value to serialize (can be any type)
 * @param runId - Run ID for encryption context
 * @param key - Encryption key (undefined to skip encryption)
 * @param global - Global object for serialization context
 * @returns The dehydrated value as binary data (Uint8Array) with format prefix
 */
export declare function dehydrateRunError(value: unknown, _runId: string, key: PayloadKey | undefined, global?: Record<string, any>, compression?: CompressionMode): Promise<Uint8Array>;
/**
 * Called from the client side (or observability tools) to hydrate the run
 * error value of a failed workflow run.
 *
 * @param value - Binary serialized data (Uint8Array) with format prefix
 * @param runId - Run ID for decryption context
 * @param key - Encryption key (undefined to skip decryption)
 * @param ops - Promise array for stream operations
 * @param global - Global object for deserialization context
 * @param extraRevivers - Additional revivers for custom types
 * @param options - External hydration policy, including lazy readable streams
 * @returns The hydrated thrown value, ready to be consumed by the client
 */
export declare function hydrateRunError(value: Uint8Array | unknown, runId: string, key: PayloadKey | undefined, ops?: Promise<void>[], global?: Record<string, any>, extraRevivers?: Record<string, (value: any) => any>, options?: ExternalReviverOptions): Promise<unknown>;
/**
 * Called from the workflow handler when replaying the event log of a `step_completed` event.
 * Hydrates the return value of a step from the database.
 *
 * @param value - Binary serialized data (Uint8Array) with format prefix
 * @param runId - Run ID for decryption context
 * @param key - Encryption key (undefined to skip decryption)
 * @param global - Global object for deserialization context
 * @param extraRevivers - Additional revivers for custom types
 * @param prepared - Optional cached decrypt/decompress result
 * Called from the workflow handler when replaying the event log
 * of a `step_completed` event.
 */
export declare function hydrateStepReturnValue(value: Uint8Array | unknown, _runId: string, key: PayloadKey | undefined, global?: Record<string, any>, extraRevivers?: Record<string, (value: any) => any>, prepared?: PreparedReplayPayload): Promise<any>;
//# sourceMappingURL=serialization.d.ts.map