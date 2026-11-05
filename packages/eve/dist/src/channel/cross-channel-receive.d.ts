import type { MessageContent } from "#shared/message-content.js";
import type { ChannelAdapter } from "#channel/adapter.js";
import { type ChannelReference, type CompiledChannel } from "#channel/compiled-channel.js";
import type { ChannelDeliverySource } from "#channel/delivery-metadata.js";
import type { InferReceiveTarget } from "#channel/receive-target.js";
import { type SessionSendOptions } from "#channel/session.js";
import type { Delivery } from "#shared/delivery.js";
import type { Runtime } from "#channel/types.js";
import type { ResolvedChannelDefinition } from "#runtime/types.js";
/** Message delivery bound to one channel-specific proactive target. */
export interface CrossChannelTargetHandle {
    /**
     * Starts a session at the target, or continues the one that owns it. The
     * channel's `receive()` hook gets `options` with the message and target.
     */
    send(message: MessageContent, options: SessionSendOptions): Promise<Delivery>;
}
/** Selects another authored channel and one of its proactive targets. */
export type CrossChannelToFn = <TChannel extends ChannelReference<unknown>>(channel: TChannel, target: InferReceiveTarget<TChannel>) => CrossChannelTargetHandle;
/**
 * Channel record consumed by the receiver — keeps the public-facing
 * `definition` reference so callers can identify a target by value
 * (the same module-default they imported in their route file).
 */
export interface CrossChannelTarget {
    readonly name: string;
    readonly definition: CompiledChannel;
    readonly receive?: CompiledChannel["receive"];
    readonly adapter?: ChannelAdapter;
    readonly turnPolicy?: CompiledChannel["turnPolicy"];
}
/** What a forwarded delivery inherits from the caller; the target channel supplies its own name. */
type CrossChannelDeliverySource = Omit<ChannelDeliverySource, "channelKind" | "channelName">;
/**
 * Projects an agent's resolved channels into the receiver-input shape.
 *
 * Framework-internal fetch-only channels carry no `definition` reference
 * and are filtered out at this boundary — only authored channels backed
 * by a `defineChannel` value can be receive targets.
 */
export declare function toCrossChannelTargets(channels: readonly ResolvedChannelDefinition[]): readonly CrossChannelTarget[];
/**
 * Builds the `ctx.to(channel, target)` closure used by route and schedule
 * handlers and tools.
 */
export declare function createCrossChannelToFn(runtime: Runtime, channels: readonly CrossChannelTarget[], source?: CrossChannelDeliverySource): CrossChannelToFn;
export {};
