import { type parseSlackWebhookBody } from "#compiled/@chat-adapter/slack/webhook.js";
import type { SlackChannelConfig } from "#public/channels/slack/slackChannel.js";
import type { SlackTransportOptions } from "#public/channels/slack/transport.js";
type SlashCommandPayload = Extract<ReturnType<typeof parseSlackWebhookBody>, {
    kind: "slash_command";
}>;
export declare function dispatchSlashCommand(payload: SlashCommandPayload, ctx: {
    readonly waitUntil: (task: Promise<unknown>) => void;
}, deps: {
    readonly api: SlackTransportOptions | undefined;
    readonly config: SlackChannelConfig;
}): void;
export {};
