import type { ChannelAudience } from "#shared/channel-audience.js";
import type { AudienceContext } from "#shared/conversation-context.js";
type ChannelAudienceSource = {
    readonly kind: string;
    readonly state?: Record<string, unknown> | undefined;
    readonly instrumentation?: {
        readonly audience?: ChannelAudienceProjector;
        readonly metadata?: (state: Record<string, unknown> | undefined) => unknown;
    };
};
export type ChannelAudienceProjector = (input: AudienceContext<Record<string, unknown> | undefined>) => ChannelAudience;
export declare function resolveAudience(adapter: ChannelAudienceSource, input: AudienceContext<Record<string, unknown> | undefined>): ChannelAudience;
export {};
