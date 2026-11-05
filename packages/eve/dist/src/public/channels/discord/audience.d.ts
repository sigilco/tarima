import type { ChannelAudience } from "#shared/channel-audience.js";
import type { DiscordChannelState } from "#public/channels/discord/discordChannel.js";
import type { DiscordInstrumentationMetadata } from "#public/channels/discord/index.js";
export declare function discordAudience(channelType: number | undefined): ChannelAudience;
export declare function discordInstrumentationMetadata(state: DiscordChannelState): DiscordInstrumentationMetadata;
