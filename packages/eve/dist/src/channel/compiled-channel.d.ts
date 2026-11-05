import type { ChannelAdapter } from "#channel/adapter.js";
import type { ChannelReceiveContext } from "#channel/channel-operations.js";
import type { NormalizedChannelCorsOptions } from "#channel/cors.js";
import type { TypedReceiveTarget } from "#channel/receive-target.js";
import type { RouteDefinition } from "#channel/routes.js";
import type { Delivery } from "#shared/delivery.js";
import type { TurnPolicy } from "#channel/types.js";
import type { GenericReceiveInput } from "#shared/channel-definition.js";
import type { JsonObject } from "#shared/json.js";
export declare const CHANNEL_SENTINEL: "eve:channel";
interface ChannelBuildMetadata {
    readonly externalCredentials?: unknown;
    readonly manifest?: JsonObject;
}
type ChannelBuildMetadataFactory = (channelName: string) => ChannelBuildMetadata;
/** Structural identity shared by public authored channels and compiled channels. */
export interface ChannelReference<TReceiveTarget = Record<string, unknown>> extends TypedReceiveTarget<TReceiveTarget> {
    readonly __kind: typeof CHANNEL_SENTINEL;
}
export interface CompiledChannel<TState = undefined, TReceiveTarget = Record<string, unknown>, TMetadata extends Record<string, unknown> = Record<string, unknown>> extends ChannelReference<TReceiveTarget> {
    readonly routes: readonly RouteDefinition<TState>[];
    readonly adapter: ChannelAdapter<any>;
    readonly cors?: NormalizedChannelCorsOptions;
    readonly __metadata?: TMetadata;
    readonly receive?: (input: GenericReceiveInput<TReceiveTarget>, ctx: ChannelReceiveContext<TState>) => Promise<Delivery>;
    readonly turnPolicy?: TurnPolicy;
}
export declare function isCompiledChannel(value: unknown): value is CompiledChannel;
export declare function getChannelBuildMetadata(value: unknown, channelName: string): ChannelBuildMetadata | undefined;
export declare function setChannelBuildMetadata(channel: unknown, factory: ChannelBuildMetadataFactory): void;
export declare function getChannelInstrumentationKind(value: unknown): string | undefined;
export declare function setChannelInstrumentationKind(channel: CompiledChannel, kind: string): void;
export {};
