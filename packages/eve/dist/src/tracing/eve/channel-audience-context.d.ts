import { type Context } from "#compiled/@opentelemetry/api/index.js";
import { type ChannelAudience } from "#shared/channel-audience.js";
export declare function channelAudienceFromContext(context: unknown): ChannelAudience;
export declare function withChannelAudience(context: Context, audience: unknown): Context;
