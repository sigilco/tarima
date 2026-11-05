import type { ChannelDeliveryMetadata, SessionTraceSeed } from "#channel/types.js";
export interface ChannelDeliverySource {
    readonly acceptedDeploymentId?: string;
    readonly channelKind: string;
    readonly channelName: string;
    readonly requestId?: string;
    readonly requestTraceContext?: SessionTraceSeed;
}
/** Mints the opaque identity for one inbound channel operation. */
export declare function createChannelDeliveryMetadata(source: ChannelDeliverySource): ChannelDeliveryMetadata;
