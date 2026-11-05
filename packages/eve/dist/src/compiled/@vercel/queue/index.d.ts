/**
 * Serializer/Deserializer interface for message payloads.
 *
 * Built-in implementations:
 * - `JsonTransport` - JSON serialization (default, buffers entire payload)
 * - `BufferTransport` - Binary data (buffers entire payload)
 * - `StreamTransport` - Pass-through streaming (no buffering, ideal for large payloads)
 */
interface Transport<T = unknown> {
    /**
     * Serialize a value to a buffer or stream for transmission.
     * The result is sent as the request body with the `contentType` header.
     */
    serialize(value: T): Buffer | ReadableStream<Uint8Array>;
    /**
     * Deserialize a readable stream back to the original value.
     * Called when receiving messages from the queue.
     */
    deserialize(stream: ReadableStream<Uint8Array>): Promise<T>;
    /**
     * Optional cleanup method for deserialized payloads that may contain resources.
     * Called automatically by ConsumerGroup on error; manual cleanup required for direct client usage.
     * @param payload The deserialized payload to clean up
     */
    finalize?(payload: T): Promise<void>;
    /**
     * MIME type for this serialization format.
     * Sent as the Content-Type header when publishing messages.
     */
    contentType: string;
}
/**
 * JSON serializer/deserializer (default transport).
 *
 * Ideal for structured data. Buffers the entire payload in memory for parsing.
 *
 * @example
 * ```typescript
 * // Default (JsonTransport is used automatically)
 * const queue = new QueueClient();
 * await queue.send("topic", { data: "example" });
 *
 * // With custom serialization
 * const queue = new QueueClient({
 *   transport: new JsonTransport({
 *     replacer: (key, value) => key === "password" ? undefined : value,
 *     reviver: (key, value) => key === "date" ? new Date(value) : value,
 *   }),
 * });
 * await queue.send("topic", { data: "example" });
 * ```
 */
declare class JsonTransport<T = unknown> implements Transport<T> {
    readonly contentType = "application/json";
    readonly replacer?: Parameters<typeof JSON.stringify>[1];
    readonly reviver?: Parameters<typeof JSON.parse>[1];
    /**
     * Create a new JsonTransport.
     * @param options - Optional JSON serialization options
     * @param options.replacer - Custom replacer for JSON.stringify
     * @param options.reviver - Custom reviver for JSON.parse
     */
    constructor(options?: {
        replacer?: Parameters<typeof JSON.stringify>[1];
        reviver?: Parameters<typeof JSON.parse>[1];
    });
    serialize(value: T): Buffer;
    deserialize(stream: ReadableStream<Uint8Array>): Promise<T>;
}
/**
 * Binary data serializer/deserializer.
 *
 * Ideal for binary data that fits in memory. Buffers the entire payload.
 *
 * @example
 * ```typescript
 * const queue = new QueueClient({ transport: new BufferTransport() });
 * await queue.send("binary-topic", myBuffer);
 * ```
 */
declare class BufferTransport implements Transport<Buffer> {
    readonly contentType = "application/octet-stream";
    serialize(value: Buffer): Buffer;
    deserialize(stream: ReadableStream<Uint8Array>): Promise<Buffer>;
}
/**
 * Pass-through stream serializer/deserializer.
 *
 * Ideal for large files and real-time streams. Does not buffer data in memory.
 *
 * **Important:** When using StreamTransport, you must call `finalize(payload)` when done
 * processing to prevent resource leaks. ConsumerGroup handles this automatically;
 * direct client usage requires manual cleanup.
 *
 * @example
 * ```typescript
 * // Sending a stream
 * const queue = new QueueClient({ transport: new StreamTransport() });
 * await queue.send("large-file", myReadableStream);
 *
 * // Receiving - cleanup handled automatically
 * const poller = new PollingQueueClient({ region: "iad1", transport: new StreamTransport() });
 * await poller.receive("large-file", "processor", async (stream, meta) => {
 *   const reader = stream.getReader();
 *   // Process chunks...
 * });
 * ```
 */
declare class StreamTransport implements Transport<ReadableStream<Uint8Array>> {
    readonly contentType = "application/octet-stream";
    serialize(value: ReadableStream<Uint8Array>): ReadableStream<Uint8Array>;
    deserialize(stream: ReadableStream<Uint8Array>): Promise<ReadableStream<Uint8Array>>;
    /**
     * Consume any remaining stream data to prevent resource leaks.
     * Called automatically by ConsumerGroup; manual call required for direct client usage.
     */
    finalize(payload: ReadableStream<Uint8Array>): Promise<void>;
}

/**
 * Vercel Queue Service client types
 */

/**
 * Minimal structural stand-ins for the `@opentelemetry/api` types referenced by
 * this SDK's public surface. They are defined locally rather than imported so
 * the optional `@opentelemetry/api` peer never appears in the published
 * `.d.ts` — otherwise consumers who don't install it fail to compile under the
 * TypeScript default `skipLibCheck: false`. A real `@opentelemetry/api`
 * `Tracer` / `AttributeValue` is structurally assignable to these.
 */
/** Subset of `@opentelemetry/api`'s `AttributeValue`. */
type AttributeValue = string | number | boolean | Array<null | undefined | string> | Array<null | undefined | number> | Array<null | undefined | boolean>;
/** Subset of `@opentelemetry/api`'s `Span` produced when starting a span. */
interface OtelSpan {
    setAttribute(key: string, value: AttributeValue): unknown;
    setStatus(status: {
        code: number;
        message?: string;
    }): unknown;
    end(): void;
}
/** Subset of `@opentelemetry/api`'s `Tracer` used by this SDK. */
interface Tracer {
    startSpan(name: string, options?: {
        kind?: number;
        attributes?: Record<string, AttributeValue>;
        links?: unknown[];
    }, context?: unknown): OtelSpan;
}

/**
 * Vercel region code. The 20 known codes match
 * {@link https://dcs.vercel-infra.com/ | dcs.vercel-infra.com}.
 * Arbitrary strings are also accepted for forward compatibility
 * with regions added after this SDK version.
 */
type VercelRegion = "arn1" | "bom1" | "cdg1" | "cle1" | "cpt1" | "dub1" | "dxb1" | "fra1" | "gru1" | "hkg1" | "hnd1" | "iad1" | "icn1" | "kix1" | "lhr1" | "pdx1" | "sfo1" | "sin1" | "syd1" | "yul1" | (string & {});
/**
 * Resolves a region code to a base {@link URL} for the Vercel Queue Service API.
 *
 * The SDK appends its own API path (`/api/v3/…`) to the returned URL.
 * To add a prefix (e.g. when routing through a reverse proxy), include it
 * in the pathname of the returned URL:
 *
 * ```ts
 * // Default — domain only, no prefix:
 * (region) => new URL(`https://${region}.vercel-queue.com`)
 *
 * // Custom domain with a base path:
 * (region) => new URL(`https://my-proxy.example/custom-prefix`)
 * // → requests go to https://my-proxy.example/custom-prefix/api/v3/…
 * ```
 *
 * Default: `` (region) => new URL(`https://${region}.vercel-queue.com`) ``
 */
type BaseUrlResolver = (region: string) => URL;
/**
 * Client-level OpenTelemetry configuration.
 *
 * Controls the optional trace correlation built into the client: the
 * PRODUCER `vqs.send` span and W3C trace-context injection on `send()`,
 * and trace-context extraction around callback handlers.
 *
 * The `VERCEL_QUEUE_TRACE_PROPAGATION=off` environment variable always takes
 * precedence and disables tracing regardless of these options.
 */
interface TelemetryOptions {
    /**
     * Whether tracing (send spans, trace-context injection, and callback
     * context extraction) is enabled for this client.
     * Can be overridden per send via {@link SendTelemetryOptions.isEnabled}.
     * @default true
     */
    isEnabled?: boolean;
    /**
     * Custom OpenTelemetry `Tracer` used to start `vqs.send` spans.
     * @default trace.getTracer("@vercel/queue") from the global tracer provider
     */
    tracer?: Tracer;
    /**
     * Static attributes stamped on every `vqs.send` span. Keys are prefixed
     * with `vqs.metadata.` to avoid colliding with semantic-convention
     * attributes. Merged with per-send metadata; per-send values win on
     * key conflicts.
     */
    metadata?: Record<string, AttributeValue>;
}
/**
 * Per-send OpenTelemetry configuration overrides.
 * See {@link TelemetryOptions} for the client-level configuration.
 */
interface SendTelemetryOptions {
    /**
     * Overrides the client-level `isEnabled` for this send only.
     * The `VERCEL_QUEUE_TRACE_PROPAGATION=off` environment variable still
     * takes precedence.
     * @default the client-level setting (which defaults to true)
     */
    isEnabled?: boolean;
    /**
     * Attributes stamped on this send's `vqs.send` span, prefixed with
     * `vqs.metadata.`. Merged over client-level metadata; values here win
     * on key conflicts.
     */
    metadata?: Record<string, AttributeValue>;
}
interface QueueClientOptions {
    /**
     * Vercel region code for API routing.
     *
     * Requests are sent to the regional endpoint resolved by
     * {@link BaseUrlResolver} (default: `https://${region}.vercel-queue.com`).
     *
     * When omitted, the region is auto-detected from the `VERCEL_REGION`
     * environment variable (set automatically on Vercel). If not available,
     * defaults to `"iad1"` with a console warning.
     *
     * @example
     * ```ts
     * new QueueClient()                         // auto-detect, falls back to "iad1"
     * new QueueClient({ region: "iad1" })       // explicit
     * ```
     */
    region?: VercelRegion;
    /**
     * Custom resolver that maps a region code to a base {@link URL}.
     *
     * The SDK always appends its own API path (`/api/v3/…`) to the returned URL.
     * Include a pathname to add a prefix (e.g. for reverse-proxy routing):
     *
     * ```ts
     * resolveBaseUrl: (region) => new URL(`https://my-proxy.example/prefix`)
     * ```
     *
     * @default (region) => new URL(`https://${region}.vercel-queue.com`)
     */
    resolveBaseUrl?: BaseUrlResolver;
    /**
     * Authentication token for the Vercel Queue Service API.
     * If not provided, the client will attempt to get a token via OIDC
     * when running in a Vercel Function environment.
     */
    token?: string;
    /**
     * Custom headers to include in all requests.
     */
    headers?: Record<string, string>;
    /**
     * Deployment ID for message routing and lease validation.
     *
     * - `undefined` (default): auto-detect from `VERCEL_DEPLOYMENT_ID` env var;
     *   sent messages are pinned to this deployment.
     * - `null`: explicitly unpinned — no deployment ID is sent on any request.
     * - `"dpl_xxx"`: explicit value used for both send pinning and consume identification.
     *
     * Ignored in development mode (deployment ID is never sent locally).
     */
    deploymentId?: string | null;
    /**
     * Serializer/deserializer for message payloads.
     * Used for all send and receive operations.
     * @default JsonTransport
     */
    transport?: Transport;
    /**
     * Custom HTTP dispatcher passed to every `fetch()` call.
     *
     * Use an undici `Agent` for connection pooling. A `RetryAgent` does not retry
     * `POST` by default and cannot replay streaming request bodies. Queue sends
     * use `POST`, and batch sends stream, so handle send failures in application
     * code and use idempotency keys before retrying.
     *
     * @example
     * ```ts
     * import { Agent } from 'undici';
     *
     * new QueueClient({ dispatcher: new Agent({ connections: 8 }) });
     * ```
     */
    dispatcher?: unknown;
    /**
     * OpenTelemetry configuration for this client.
     *
     * Applies to sends (the `vqs.send` span and trace-context injection) and
     * to callback handlers created from this client (trace-context extraction).
     * Tracing is enabled by default; requires `@opentelemetry/api` and a
     * registered OTEL SDK to have any effect.
     *
     * @example
     * ```ts
     * new QueueClient({
     *   telemetry: {
     *     isEnabled: true,
     *     tracer: myTracer,
     *     metadata: { service: "billing" },
     *   },
     * });
     * ```
     */
    telemetry?: TelemetryOptions;
}
/**
 * Options for creating a {@link PollingQueueClient}.
 *
 * Identical to {@link QueueClientOptions} except `region` is **required**
 * because messages can only be received from the region they were sent to.
 * Using a fixed region (e.g. `"iad1"`) ensures that `send` and `receive`
 * target the same endpoint.
 */
interface PollingQueueClientOptions extends QueueClientOptions {
    /**
     * Vercel region code for API routing — **required** for polling.
     *
     * Messages can only be received from the region they were sent to.
     * Use a fixed region (e.g. `"iad1"`) for both sending and receiving.
     *
     * @example
     * ```ts
     * new PollingQueueClient({ region: "iad1" })
     * ```
     */
    region: VercelRegion;
}
/**
 * Options for sending messages.
 */
interface SendOptions {
    /**
     * Key used to deduplicate message delivery. Repeated sends are accepted,
     * but only one message is delivered.
     * Deduplication window: `min(message retention, 24 hours)`.
     *
     * Must be at most 256 characters. Longer keys are rejected with a 400.
     *
     * @maxLength 256
     */
    idempotencyKey?: string;
    /**
     * Message retention time in seconds. After this period, the message expires.
     * @default 86400 (24 hours)
     * @minimum 60 (1 minute)
     * @maximum 604800 (7 days)
     */
    retentionSeconds?: number;
    /**
     * Delay delivery of the message by this many seconds.
     * The message will not be visible to consumers until the delay has passed.
     * @default 0
     * @minimum 0
     * @maximum 604800 (7 days, cannot exceed retentionSeconds)
     */
    delaySeconds?: number;
    /**
     * Custom headers to include with this message.
     * These headers are passed through to the VQS server.
     */
    headers?: Record<string, string>;
    /**
     * OpenTelemetry overrides for this send only.
     * `isEnabled` overrides the client-level setting; `metadata` is merged
     * over client-level metadata (this send wins on key conflicts).
     */
    telemetry?: SendTelemetryOptions;
}
interface SendMessageOptions<T = unknown> extends SendOptions {
    /**
     * The topic/queue name to send the message to.
     * Must match pattern: `[A-Za-z0-9_-]+`
     */
    queueName: string;
    /**
     * The message payload. Will be serialized using the provided transport.
     */
    payload: T;
}
/**
 * Result returned by `send()`.
 *
 * `messageId` is `null` when the server accepted the message for deferred
 * processing (e.g. during a server-side outage) and no ID is available yet.
 */
interface SendResult {
    messageId: string | null;
}
/** One message in a batch send. */
type BatchSendMessage<T = unknown> = Omit<SendMessageOptions<T>, "queueName" | "telemetry">;
/** Options shared by the entire batch request. */
type BatchSendOptions = Pick<SendOptions, "telemetry">;
/**
 * Result for one message in a successful batch request. Results are returned
 * in the same order as the input messages.
 *
 * A request-level error does not return per-message results and can happen
 * after the server accepted messages. Use idempotency keys when retrying the
 * request so accepted messages are not delivered twice.
 */
type BatchSendResult = {
    /** The message was accepted and has an assigned ID. */
    status: "sent";
    messageId: string;
} | {
    /** The message was accepted for deferred processing without an ID. */
    status: "deferred";
    messageId: null;
} | {
    /** The message was not accepted. */
    status: "failed";
    /** HTTP status describing why this message failed. */
    statusCode: number;
    /** Human-readable failure description. */
    error: string;
    /** Whether retrying this message may succeed. */
    retryable: boolean;
};
interface Message<T = unknown> {
    /**
     * Unique message identifier. Used for receive-by-ID operations.
     */
    messageId: string;
    /**
     * The deserialized message payload.
     * Note: If using StreamTransport, ensure proper cleanup by calling
     * `transport.finalize(payload)` when done processing, especially in error cases.
     */
    payload: T;
    /**
     * Number of times this message has been delivered.
     * Starts at 1 for the first delivery, increments on each retry.
     */
    deliveryCount: number;
    /**
     * Timestamp when the message was created/published.
     */
    createdAt: Date;
    /**
     * Timestamp when the message expires.
     * Present in v2beta binary callback (`ce-vqsexpiresat` header) and
     * V3 multipart/NDJSON responses (`Vqs-Expires-At` header / `expiresAt` field).
     */
    expiresAt?: Date;
    /**
     * MIME type of the message content.
     * Set by the transport's `contentType` property during publish.
     */
    contentType: string;
    /**
     * Receipt handle (lease token) for this message delivery.
     * Required for acknowledge and visibility extension operations.
     * Valid only until the visibility timeout expires.
     */
    receiptHandle: string;
}
/**
 * Message metadata provided to handlers
 */
interface MessageMetadata {
    messageId: string;
    deliveryCount: number;
    createdAt: Date;
    expiresAt: Date;
    topicName: string;
    consumerGroup: string;
    /** Vercel region the client is targeting. */
    region: string;
}
/**
 * Instruction returned by a {@link RetryHandler} to control what happens
 * to a message when the handler throws.
 *
 * - `{ afterSeconds: N }` — reschedule the message for redelivery after N seconds
 * - `{ acknowledge: true }` — acknowledge the message so it is never retried
 */
type RetryDirective = {
    afterSeconds: number;
} | {
    acknowledge: true;
};
/**
 * Called when the message handler throws an error.
 * Return a {@link RetryDirective} to reschedule or acknowledge the message,
 * or return `undefined` to let the error propagate normally.
 */
type RetryHandler = (error: unknown, metadata: MessageMetadata) => RetryDirective | void | undefined;
/**
 * Message handler function type.
 *
 * Called once per message with the deserialized payload and metadata.
 * Not called when the queue is empty — check the return value of `receive()` instead.
 */
type MessageHandler<T = unknown> = (message: T, metadata: MessageMetadata) => Promise<void> | void;
/**
 * Result returned by `receive()`. Use `ok` to check if messages were processed.
 *
 * @example
 * ```typescript
 * const result = await receive("topic", "group", handler);
 * if (result.ok) {
 *   // Messages were processed successfully
 * } else if (result.reason === "empty") {
 *   // Queue had no messages available
 * }
 * ```
 */
type ReceiveResult = {
    ok: true;
} | {
    ok: false;
    reason: "empty";
} | {
    ok: false;
    reason: "not_found";
    messageId: string;
} | {
    ok: false;
    reason: "not_available";
    messageId: string;
} | {
    ok: false;
    reason: "already_processed";
    messageId: string;
};
/**
 * Options for receiving a specific message by ID.
 */
interface ReceiveByIdOptions {
    /** The specific message ID to consume */
    messageId: string;
    /**
     * Message lock duration in seconds.
     * @default 300 (5 minutes)
     * @minimum 30
     * @maximum 3600 (1 hour)
     */
    visibilityTimeoutSeconds?: number;
    /**
     * Called when the handler throws. Return `{ afterSeconds: N }` to reschedule
     * the message for redelivery after N seconds, or return `undefined`
     * to let the error propagate normally.
     */
    retry?: RetryHandler;
}
/**
 * Options for receiving messages from the queue with an optional batch limit.
 */
interface ReceiveBatchOptions {
    /**
     * Maximum number of messages to retrieve in a single request.
     * @default 1
     * @minimum 1
     * @maximum 10
     */
    limit?: number;
    /**
     * Message lock duration in seconds.
     * @default 300 (5 minutes)
     * @minimum 30
     * @maximum 3600 (1 hour)
     */
    visibilityTimeoutSeconds?: number;
    /**
     * Called when the handler throws. Return `{ afterSeconds: N }` to reschedule
     * the message for redelivery after N seconds, or return `undefined`
     * to let the error propagate normally.
     */
    retry?: RetryHandler;
}
/**
 * Options for the receive method. Either receive by message ID or receive
 * from the queue with an optional limit. These options are mutually exclusive.
 */
type ReceiveOptions = ReceiveByIdOptions | ReceiveBatchOptions;
/**
 * Error thrown when a message does not exist or has expired.
 */
declare class MessageNotFoundError extends Error {
    constructor(messageId: string);
}
/**
 * Error thrown when a message exists but cannot be processed.
 * This can happen when the message is in the wrong state or already claimed by another consumer.
 */
declare class MessageNotAvailableError extends Error {
    constructor(messageId: string, reason?: string);
}
/**
 * Error thrown when message data is corrupted or can't be parsed
 */
declare class MessageCorruptedError extends Error {
    constructor(messageId: string, reason: string);
}
/**
 * Error thrown when there are no messages available in the queue.
 */
declare class QueueEmptyError extends Error {
    constructor(queueName: string, consumerGroup: string);
}
/**
 * Error thrown when a message is temporarily locked by another consumer.
 * The message is currently being processed and cannot be claimed.
 */
declare class MessageLockedError extends Error {
    /** Suggested retry delay in seconds, if provided by the server. */
    readonly retryAfter?: number;
    constructor(messageId: string, retryAfter?: number);
}
/**
 * Error thrown when the server rate-limits a request (HTTP 429).
 */
declare class TooManyRequestsError extends Error {
    /** Suggested retry delay in seconds, from the Retry-After header, if sent. */
    readonly retryAfter?: number;
    constructor(message?: string, retryAfter?: number);
}
/**
 * Error thrown when authentication fails.
 * This typically means the token is missing, invalid, or expired.
 */
declare class UnauthorizedError extends Error {
    constructor(message?: string);
}
/**
 * Error thrown when access is forbidden.
 * This typically means the queue belongs to a different environment or project.
 */
declare class ForbiddenError extends Error {
    constructor(message?: string);
}
/**
 * Error thrown when request parameters are invalid.
 */
declare class BadRequestError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when the server encounters an unexpected error.
 */
declare class InternalServerError extends Error {
    constructor(message?: string);
}
/**
 * Error thrown when the batch limit parameter is outside the valid range.
 * The limit must be between 1 and 10 (inclusive).
 */
declare class InvalidLimitError extends Error {
    constructor(limit: number, min?: number, max?: number);
}
/**
 * Error thrown when attempting to process a message that has already been successfully processed.
 */
declare class MessageAlreadyProcessedError extends Error {
    constructor(messageId: string);
}
/**
 * Error thrown when consumer discovery fails.
 * This typically means the deployment could not be reached or is not configured correctly.
 */
declare class ConsumerDiscoveryError extends Error {
    readonly deploymentId?: string;
    constructor(message: string, deploymentId?: string);
}
/**
 * Error thrown when the consumer registry is not configured for the project.
 */
declare class ConsumerRegistryNotConfiguredError extends Error {
    constructor(message?: string);
}

type CallbackRequestInput$1 = Request | {
    request: Request;
};
/**
 * Queue client for push-based (callback) workflows.
 *
 * Use this client when Vercel delivers messages to your route handlers.
 * Provides {@link send}, {@link handleCallback}, and {@link handleNodeCallback}.
 *
 * Region is resolved automatically:
 * 1. Explicit `region` option (highest priority)
 * 2. `VERCEL_REGION` environment variable (set automatically on Vercel)
 * 3. Falls back to `"iad1"` with a console warning
 *
 * The constructor never throws — `new QueueClient()` always works.
 *
 * For manual polling workflows, use {@link PollingQueueClient} instead.
 *
 * @example
 * ```typescript
 * import { QueueClient } from "@vercel/queue";
 *
 * const queue = new QueueClient();
 * export const { send, handleCallback, handleNodeCallback } = queue;
 * ```
 */
declare class QueueClient {
    constructor(options?: QueueClientOptions);
    /**
     * Send a message to a topic.
     *
     * This is an arrow function property so it can be destructured:
     * ```typescript
     * const { send } = new QueueClient();
     * await send("my-topic", payload);
     * ```
     *
     * @param topicName - Name of the topic (pattern: `[A-Za-z0-9_-]+`)
     * @param payload - The data to send (serialized via the configured transport)
     * @param options - Optional send options (idempotencyKey, retentionSeconds, delaySeconds, headers)
     * @returns `{ messageId }` — `messageId` is `null` when the server accepted
     *   the message for deferred processing (no ID available yet)
     */
    send: <T = unknown>(topicName: string, payload: T, options?: SendOptions) => Promise<SendResult>;
    /**
     * Send up to 100 messages to a topic in one HTTP request.
     *
     * Results are returned in input order. A valid batch may contain a mix of
     * sent, deferred, and failed entries; inspect every result.
     */
    experimental_sendBatch: <T = unknown>(topicName: string, messages: readonly BatchSendMessage<T>[], options?: BatchSendOptions) => Promise<BatchSendResult[]>;
    /**
     * Create a Web API route handler for processing queue callback messages.
     *
     * Parses incoming `Request` as a CloudEvent and invokes the handler.
     * For use on Vercel — Vercel invokes this route when messages are available.
     *
     * This is an arrow function property so it can be destructured:
     * ```typescript
     * const { handleCallback } = new QueueClient();
     * export const POST = handleCallback(handler);
     * ```
     *
     * @param handler - Function to process the message payload and metadata
     * @param options - Optional configuration
     * @param options.visibilityTimeoutSeconds - Message lock duration (default: 300, max: 3600)
     * @param options.retry - Called when the handler throws. Return `{ afterSeconds: N }` to
     *   reschedule the message for redelivery after N seconds.
     * @returns A route handler that accepts either `Request` or `{ request: Request }`
     */
    handleCallback: <T = unknown>(handler: MessageHandler<T>, options?: {
        visibilityTimeoutSeconds?: number;
        retry?: RetryHandler;
    }) => ((requestOrEvent: CallbackRequestInput$1) => Promise<Response>);
    /**
     * Create a Connect-style route handler for processing queue callback messages.
     * For use on Vercel — Vercel invokes this route when messages are available.
     *
     * For frameworks using the `(req, res)` middleware pattern where `req.body`
     * is pre-parsed (Next.js Pages Router, etc.).
     *
     * This is an arrow function property so it can be destructured:
     * ```typescript
     * const { handleNodeCallback } = new QueueClient();
     * app.post("/api/queue", handleNodeCallback(handler));
     * ```
     *
     * @param handler - Function to process the message payload and metadata
     * @param options - Optional configuration
     * @param options.visibilityTimeoutSeconds - Message lock duration (default: 300, max: 3600)
     * @param options.retry - Called when the handler throws. Return `{ afterSeconds: N }` to
     *   reschedule the message for redelivery after N seconds.
     * @returns A `(req, res) => Promise<void>` route handler
     */
    handleNodeCallback: <T = unknown>(handler: MessageHandler<T>, options?: {
        visibilityTimeoutSeconds?: number;
        retry?: RetryHandler;
    }) => ((req: {
        method?: string;
        headers: Record<string, string | string[] | undefined>;
        body?: unknown;
    }, res: {
        status(code: number): {
            json(data: unknown): void;
            end(): void;
        };
        end(): void;
    }) => Promise<void>);
}
/**
 * Queue client for poll-based (manual receive) workflows.
 *
 * Use this client when you manually poll for messages with {@link receive}.
 * Also provides {@link send} for publishing messages.
 *
 * Region is **required** because messages can only be received from the
 * region they were sent to. Use a fixed region (e.g. `"iad1"`) for both
 * sending and receiving.
 *
 * For push-based (callback) workflows on Vercel, use {@link QueueClient} instead.
 *
 * @example
 * ```typescript
 * import { PollingQueueClient } from "@vercel/queue";
 *
 * const queue = new PollingQueueClient({ region: "iad1" });
 * export const { send, receive } = queue;
 * ```
 */
declare class PollingQueueClient {
    constructor(options: PollingQueueClientOptions);
    /**
     * Send a message to a topic.
     *
     * This is an arrow function property so it can be destructured:
     * ```typescript
     * const { send } = new PollingQueueClient({ region: "iad1" });
     * await send("my-topic", payload);
     * ```
     *
     * @param topicName - Name of the topic (pattern: `[A-Za-z0-9_-]+`)
     * @param payload - The data to send (serialized via the configured transport)
     * @param options - Optional send options (idempotencyKey, retentionSeconds, delaySeconds, headers)
     * @returns `{ messageId }` — `messageId` is `null` when the server accepted
     *   the message for deferred processing (no ID available yet)
     */
    send: <T = unknown>(topicName: string, payload: T, options?: SendOptions) => Promise<SendResult>;
    /**
     * Send up to 100 messages to a topic in one HTTP request.
     *
     * Results are returned in input order. A valid batch may contain a mix of
     * sent, deferred, and failed entries; inspect every result.
     */
    experimental_sendBatch: <T = unknown>(topicName: string, messages: readonly BatchSendMessage<T>[], options?: BatchSendOptions) => Promise<BatchSendResult[]>;
    /**
     * Receive and process messages from a topic.
     *
     * Each message is automatically locked, kept alive via periodic visibility
     * extensions during processing, and acknowledged upon successful handler completion.
     * The handler is not called when the queue is empty — check `result.ok` instead.
     *
     * This is an arrow function property so it can be destructured:
     * ```typescript
     * const { receive } = new PollingQueueClient({ region: "iad1" });
     * const result = await receive("my-topic", "my-group", handler);
     * if (!result.ok) console.log(result.reason);
     * ```
     *
     * @param topicName - Name of the topic (pattern: `[A-Za-z0-9_-]+`)
     * @param consumerGroup - Name of the consumer group (pattern: `[A-Za-z0-9_-]+`)
     * @param handler - Function to process each message payload and metadata.
     *                  Not called when the queue is empty.
     * @param options - Optional receive options (visibilityTimeoutSeconds, limit, or messageId)
     * @returns Discriminated result: `{ ok: true }` on success, `{ ok: false, reason }` otherwise
     */
    receive: <T = unknown>(topicName: string, consumerGroup: string, handler: MessageHandler<T>, options?: ReceiveOptions) => Promise<ReceiveResult>;
}

type CallbackRequestInput = Request | {
    request: Request;
};
/**
 * Send a message to a topic using the default auto-configured client.
 *
 * The default client auto-detects the region from `VERCEL_REGION`,
 * falling back to `"iad1"` with a console warning on first use.
 *
 * This is an arrow function–free alternative to destructuring from a
 * {@link QueueClient} instance — import and use directly:
 * ```typescript
 * import { send } from "@vercel/queue";
 * await send("my-topic", { hello: "world" });
 * ```
 *
 * @param topicName - Name of the topic (pattern: `[A-Za-z0-9_-]+`)
 * @param payload - The data to send (serialized via JsonTransport)
 * @param options - Optional send options. Pass `region` to route to a specific region.
 * @returns `{ messageId }` — `messageId` is `null` when the server accepted
 *   the message for deferred processing
 */
declare function send<T = unknown>(topicName: string, payload: T, options?: SendOptions & {
    region?: VercelRegion;
}): Promise<SendResult>;
/**
 * Send up to 100 messages in one HTTP request using the default
 * auto-configured client.
 */
declare function experimental_sendBatch<T = unknown>(topicName: string, messages: readonly BatchSendMessage<T>[], options?: BatchSendOptions & {
    region?: VercelRegion;
}): Promise<BatchSendResult[]>;
/**
 * Create a Web API route handler for processing queue callback messages
 * using the default auto-configured client.
 *
 * The default client auto-detects the region from `VERCEL_REGION`,
 * falling back to `"iad1"` with a console warning on first use.
 * The callback region is determined automatically from the incoming
 * `ce-vqsregion` header in the v2beta event — no manual configuration needed.
 *
 * This is an arrow function–free alternative to destructuring from a
 * {@link QueueClient} instance — import and use directly:
 * ```typescript
 * import { handleCallback } from "@vercel/queue";
 * export const POST = handleCallback(async (message, metadata) => {
 *   console.log("Processing:", message);
 * });
 * ```
 *
 * @param handler - Function to process the message payload and metadata
 * @param options - Optional configuration (visibilityTimeoutSeconds, retry)
 * @returns A route handler that accepts either `Request` or `{ request: Request }`
 */
declare function handleCallback<T = unknown>(handler: MessageHandler<T>, options?: {
    visibilityTimeoutSeconds?: number;
    retry?: RetryHandler;
}): (requestOrEvent: CallbackRequestInput) => Promise<Response>;

/**
 * Options for {@link registerDevConsumer}.
 */
interface RegisterDevConsumerOptions {
    /**
     * Topic name to subscribe to. Supports wildcard patterns (e.g. `"user-*"`).
     */
    topic: string;
    /**
     * The QueueClient instance used for callback processing (visibility
     * extensions, acks, etc.). Messages delivered to the handler are fetched
     * via this client.
     */
    client: QueueClient;
    /**
     * Function invoked with each message delivered to the topic.
     */
    handler: MessageHandler;
    /**
     * Logical identifier for this consumer. Multiple consumers for the same
     * topic must use distinct groups; re-registering with the same group
     * replaces the previous handler (useful for HMR).
     *
     * @default "dev-consumer"
     */
    consumerGroup?: string;
    /**
     * Lock duration for in-flight messages. Forwarded to `coreHandleCallback`.
     */
    visibilityTimeoutSeconds?: number;
    /**
     * Called when the handler throws. Return `{ afterSeconds: N }` to schedule
     * local re-delivery, or `{ acknowledge: true }` to drop the message.
     */
    retry?: RetryHandler;
}
/**
 * Register a consumer for a topic without relying on `vercel.json` route
 * discovery or stack-trace-based caller detection.
 *
 * Intended for framework integrations (e.g. Nitro) where queue handlers are
 * wired through a central dispatcher rather than per-file `handleCallback()`
 * calls. The caller supplies the topic and a handler; `send()` in dev mode
 * will route messages through it via the same retry/re-delivery machinery
 * used for file-discovered handlers.
 *
 * Call only when `isDevMode()` is true. In production this has no effect on
 * routing — messages are delivered by the Vercel Queue Service directly.
 *
 * @returns An unregister function. Calling it removes the handler that this
 *   call registered; if the entry was replaced (via re-registration with the
 *   same `consumerGroup`), the unregister is a no-op.
 *
 * @example
 * ```ts
 * const unregister = registerDevConsumer({
 *   topic: "orders",
 *   client,
 *   handler: async (message, metadata) => {
 *     await dispatch(message, metadata);
 *   },
 *   consumerGroup: "nitro-vercel-queue",
 * });
 * ```
 */
declare function registerDevConsumer(options: RegisterDevConsumerOptions): () => void;

/**
 * Core queue callback utilities for handling incoming webhook payloads
 * from Vercel triggers using the CloudEvent specification.
 *
 * This module provides the framework-agnostic core. For framework-specific
 * wrappers, see `@vercel/queue/web` and `@vercel/queue/nextjs/pages`.
 */

declare const CLOUD_EVENT_TYPE_V1BETA = "com.vercel.queue.v1beta";
declare const CLOUD_EVENT_TYPE_V2BETA = "com.vercel.queue.v2beta";
/**
 * Routing-only callback: the SDK must fetch the message by ID.
 * Produced by v1beta structured mode and v2beta large-body mode.
 */
type ParsedCallbackV1 = {
    queueName: string;
    consumerGroup: string;
    messageId: string;
    region?: string;
};
/**
 * Full-message callback: payload and receipt handle are inlined,
 * so the SDK can process directly without an extra fetch.
 * Produced by v2beta small-body mode.
 */
type ParsedCallbackV2 = {
    queueName: string;
    consumerGroup: string;
    messageId: string;
    region?: string;
    receiptHandle: string;
    deliveryCount?: number;
    createdAt?: string;
    expiresAt?: string;
    contentType?: string;
    visibilityDeadline?: string;
    rawBody?: ReadableStream<Uint8Array>;
    parsedPayload?: unknown;
};
type ParsedCallbackRequest = ParsedCallbackV1 | ParsedCallbackV2;
/**
 * Parse a callback from a pre-parsed body and headers.
 *
 * For frameworks like Next.js Pages Router where the body has already been
 * parsed, use this instead of {@link parseCallback}.
 *
 * Detects the CloudEvent version from the `ce-type` header:
 * - `com.vercel.queue.v2beta`: binary content mode (metadata in headers,
 *   payload in body). For small messages, the body is attached as `parsedPayload`.
 * - Otherwise: structured content mode (v1beta, entire CloudEvent in JSON body)
 *
 * @param body - The framework-parsed request body. Type depends on Content-Type
 *   and framework configuration:
 *   - v1beta: parsed CloudEvent JSON object
 *   - v2beta: the message payload as parsed by the framework (object, Buffer, or string)
 * @param headers - HTTP headers
 * @returns Parsed callback request with routing metadata and optional payload
 */
declare function parseRawCallback(body: unknown, headers: Record<string, string | string[] | undefined>): ParsedCallbackRequest;
/**
 * Parse and validate a CloudEvent callback from a Web API `Request` object.
 *
 * Detects the CloudEvent version from the `ce-type` header:
 * - `com.vercel.queue.v2beta`: binary content mode (metadata in headers,
 *   payload in body). For v2beta, the body is attached as `rawBody` (a
 *   ReadableStream) rather than being parsed.
 * - Otherwise: structured content mode (v1beta, entire CloudEvent in JSON body)
 *
 * For frameworks that pre-parse the body (e.g. Next.js Pages Router),
 * use {@link parseRawCallback} instead.
 */
declare function parseCallback(request: Request): Promise<ParsedCallbackRequest>;

export { BadRequestError, type BaseUrlResolver, type BatchSendMessage, type BatchSendOptions, type BatchSendResult, BufferTransport, CLOUD_EVENT_TYPE_V1BETA, CLOUD_EVENT_TYPE_V2BETA, ConsumerDiscoveryError, ConsumerRegistryNotConfiguredError, ForbiddenError, InternalServerError, InvalidLimitError, JsonTransport, type Message, MessageAlreadyProcessedError, MessageCorruptedError, type MessageHandler, MessageLockedError, type MessageMetadata, MessageNotAvailableError, MessageNotFoundError, type ParsedCallbackRequest, type ParsedCallbackV1, type ParsedCallbackV2, PollingQueueClient, type PollingQueueClientOptions, QueueClient, type QueueClientOptions, QueueEmptyError, type ReceiveBatchOptions, type ReceiveByIdOptions, type ReceiveOptions, type ReceiveResult, type RegisterDevConsumerOptions, type RetryDirective, type RetryHandler, type SendOptions, type SendResult, type SendTelemetryOptions, StreamTransport, type TelemetryOptions, TooManyRequestsError, type Transport, UnauthorizedError, type VercelRegion, experimental_sendBatch, handleCallback, parseCallback, parseRawCallback, registerDevConsumer, send };
