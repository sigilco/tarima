import type { RemoteChildBinding } from "#execution/child-binding.js";
import type { SessionReader } from "#shared/session.js";
import type { Delivery } from "#shared/delivery.js";
import type { SessionStreamEvent } from "#protocol/session-event.js";
import type { PrewarmSessionResult } from "#protocol/prewarm-session.js";
import type { ContextAccessor } from "#context/key.js";
import { type ChannelDeliverySource } from "#channel/delivery-metadata.js";
import type { MessageContent } from "#shared/message-content.js";
import type { SessionStreamOptions, SessionControlOptions, Runtime, SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { ChannelContext } from "#shared/channel-context.js";
import { type Answer, type StrictAnswers } from "#shared/input.js";
import type { JsonObject } from "#shared/json.js";
import { type SessionHistoryMessage } from "#shared/session-history.js";
/** Immutable-ID handle for one exact durable session. */
export interface Session extends SessionReader {
    send(message: MessageContent, options: SessionSendOptions): Promise<Delivery>;
    respond<const TAnswers extends readonly Answer[]>(answers: StrictAnswers<TAnswers>, options: SessionRespondOptions): Promise<Delivery>;
    cancel(options?: SessionControlOptions & {
        readonly turnId?: string | null;
    }): Promise<Delivery>;
    /** Prepares an idle session on the deployment accepting this request, without a model turn. */
    prewarm(): Promise<PrewarmSessionResult>;
    clear(options?: SessionControlOptions): Promise<Delivery>;
    compact(options?: SessionControlOptions): Promise<Delivery>;
    /** Retires this session without creating a replacement or changing this handle's ID. */
    end(options?: SessionControlOptions & {
        readonly reason?: string;
    }): Promise<Delivery>;
    /**
     * Opens the recorded stream. Following it throws `SessionStrandedError`
     * while its owner is stranded; `follow: false` reads recorded history up to
     * the current tail without inspecting or changing the session.
     */
    stream(options?: SessionStreamOptions): AsyncIterable<SessionStreamEvent>;
}
export interface InternalSession extends Session {
    getChildBinding?(childSessionId: string): Promise<RemoteChildBinding | undefined>;
    getLineStream(options?: SessionStreamOptions): Promise<ReadableStream<unknown>>;
    getStreamTailIndex(): Promise<number>;
    /** Whether a run that can still execute owns the session; `true` when the runtime can't tell. */
    hasRunnableOwner(): Promise<boolean>;
}
/** HTTP framing and conformance readers operate on framework-created handles. */
export declare function internalSession(session: Session): InternalSession;
interface SessionDeliveryOptions {
    /** Stable delivery identity, deduplicated within this session's recent-key window. */
    readonly idempotencyKey?: string;
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    readonly outputSchema?: JsonObject;
}
/**
 * Options every server-side message send accepts: `Session.send()`,
 * `from(address).send()`, `to(channel, target).send()`, and the input a
 * channel's `receive()` hook gets.
 */
export interface SessionSendOptions {
    /** Who the session runs as. */
    readonly auth: SessionAuthContext | null;
    /** Strings added as user messages before the message, kept in session history. */
    readonly context?: readonly string[];
    /** Prior conversation added as user and assistant turns before this message and its `context`. */
    readonly history?: readonly SessionHistoryMessage[];
    /**
     * Stable delivery identity. Deduplicated within the receiving session's recent-key window, which
     * every sender to that session shares, so make it unique across senders, for example by
     * prefixing the source. A threadless Slack target also derives its session from it.
     */
    readonly idempotencyKey?: string;
    /** JSON Schema for a structured final answer. */
    readonly outputSchema?: JsonObject;
    /** Workflow run title for a session this send starts. Defaults to one derived from the message. */
    readonly title?: string;
    /** How the message treats a running turn. */
    readonly turnPolicy?: TurnPolicy;
}
/**
 * Copies only the {@link SessionSendOptions} fields and validates the key. Callers can pass wider
 * objects, which must not carry internal send fields such as `callback` across a channel boundary.
 */
export declare function toSessionSendOptions(options: SessionSendOptions): SessionSendOptions;
/** Options for answering pending input requests through a fixed session handle. */
export type SessionRespondOptions = SessionDeliveryOptions;
export declare function createSession(id: string, runtime: Runtime, metadata?: Partial<ChannelDeliverySource> & {
    readonly turnPolicy?: TurnPolicy;
}): InternalSession;
/** Builds an I/O-free factory for fixed session-ID handles. */
export declare function createAttachSessionFn(runtime: Runtime, metadata?: Partial<ChannelDeliverySource> & {
    readonly turnPolicy?: TurnPolicy;
}): (sessionId: string) => Session;
/** Live metadata and routing authority stay separate, including when auth changes mid-step. */
export declare function buildChannelContext(accessor: ContextAccessor): ChannelContext;
export {};
