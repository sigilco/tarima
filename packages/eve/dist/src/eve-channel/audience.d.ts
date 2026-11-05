import type { ChannelAudience } from "#shared/channel-audience.js";
import type { AudienceContext } from "#shared/conversation-context.js";
export declare function defaultEveAudience(input: Omit<AudienceContext<undefined>, "state">): ChannelAudience;
