import type { MessageContent } from "#shared/message-content.js";
import type { Delivery } from "#shared/delivery.js";
import { type ChannelAdapter } from "#channel/adapter.js";
import { type ChannelDeliverySource } from "#channel/delivery-metadata.js";
import type { SendPayload } from "#channel/routes.js";
import { type Session } from "#channel/session.js";
import type { Runtime, SessionAuthContext, SessionCallback, TurnPolicy } from "#channel/types.js";
import type { SessionControlOptions } from "#channel/types.js";
interface BaseChannelAddressCreateOptions {
    readonly auth: SessionAuthContext | null;
    readonly history?: SendPayload["history"];
    readonly initiatorAuth?: SessionAuthContext | null;
    readonly title?: string;
}
type ChannelAddressCreateOptions<TState = undefined> = [TState] extends [undefined] ? BaseChannelAddressCreateOptions : BaseChannelAddressCreateOptions & {
    readonly state?: Partial<TState>;
};
interface BaseChannelAddressDeliveryOptions {
    readonly idempotencyKey?: string;
    readonly auth: SessionAuthContext | null;
    readonly callback?: SessionCallback;
    readonly initiatorAuth?: SessionAuthContext | null;
    readonly title?: string;
    readonly turnPolicy?: TurnPolicy;
}
/**
 * Result of `create()`. `created` is `false` when another session already owned the address, or
 * won it concurrently; that session is returned unchanged and any `history` was not added.
 */
export interface ChannelCreateResult {
    readonly created: boolean;
    readonly session: Session;
}
/** Delivery options for a channel address whose continuation token is already bound. */
export type ChannelAddressDeliveryOptions<TState = undefined> = [TState] extends [undefined] ? BaseChannelAddressDeliveryOptions : BaseChannelAddressDeliveryOptions & {
    readonly state?: Partial<TState>;
};
/**
 * Dynamic handle for whichever durable session currently owns one channel-local address.
 * Only {@link create} and {@link send} may create a session: when the address is unowned, and
 * `send` also in place of a stranded session that another eve version built. Sends to a session whose
 * owner is only unavailable throw `SessionStrandedError` and deliver nothing.
 * Responses to an address no session holds throw `SessionNotActiveError`.
 */
interface ChannelAddress<TState = undefined> {
    readonly continuationToken: string;
    create(options: ChannelAddressCreateOptions<TState>): Promise<ChannelCreateResult>;
    deliver(input: SendPayload, options: ChannelAddressDeliveryOptions<TState>): Promise<Delivery>;
    send(message: MessageContent, options: ChannelAddressDeliveryOptions<TState>): Promise<Delivery>;
    respond(answers: SendPayload["answers"], options: ChannelAddressDeliveryOptions<TState>): Promise<Delivery>;
    cancel(options?: {
        readonly turnId?: string | null;
    } & SessionControlOptions): Promise<Delivery>;
    compact(options?: SessionControlOptions): Promise<Delivery>;
    clear(options?: SessionControlOptions): Promise<Delivery>;
    end(options?: {
        readonly reason?: string;
    } & SessionControlOptions): Promise<Delivery>;
    resolveSession(): Promise<Session | undefined>;
}
/** Factory for binding a route-local continuation token to a {@link ChannelAddress}. */
type ChannelAddressFn<TState = undefined> = (continuationToken: string) => ChannelAddress<TState>;
/** Creates one channel address backed by the runtime's continuation dispatch primitive. */
export declare function createChannelAddress<TState = undefined>(input: {
    readonly adapter: ChannelAdapter<any>;
    readonly channelName: string;
    readonly continuationToken: string;
    readonly metadata?: ChannelDeliverySource;
    readonly runtime: Runtime;
    readonly turnPolicy?: TurnPolicy;
}): ChannelAddress<TState>;
/** Builds a request-scoped factory for channel addresses on one authored channel. */
export declare function createChannelAddressFn<TState = undefined>(input: {
    readonly adapter: ChannelAdapter<any>;
    readonly channelName: string;
    readonly metadata?: ChannelDeliverySource;
    readonly runtime: Runtime;
    readonly turnPolicy?: TurnPolicy;
}): ChannelAddressFn<TState>;
export {};
