import type { MessageContent } from "#shared/message-content.js";
import type { FetchFileResult } from "#channel/adapter.js";
import type { DiscordFetch } from "#public/channels/discord/api.js";
import type { DiscordAttachment } from "#public/channels/discord/inbound.js";
/**
 * The model-visible content of a command: its prompt, plus one file part per
 * attachment, which the channel's `fetchFile` downloads. Files over the default
 * upload limit become a short note instead.
 */
export declare function discordCommandContent(text: string, attachments: readonly DiscordAttachment[]): MessageContent;
/**
 * Creates the channel's `fetchFile` for Discord CDN URLs. Any other URL
 * resolves to `null`, so it's never fetched here.
 */
export declare function createDiscordFetchFile(fetchImpl?: DiscordFetch): (url: string) => Promise<FetchFileResult | null>;
