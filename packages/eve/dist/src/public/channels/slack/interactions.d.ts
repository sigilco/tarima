/**
 * Slack interactivity wire handling. It decodes and authorizes framework HITL
 * responses, opens freeform modals inline before Slack's trigger expires, and
 * forwards user-owned actions, shortcuts, and slash commands to their authored hooks.
 */
import { type SlackBlockActionsPayload } from "#compiled/@chat-adapter/slack/webhook.js";
import { type SlackTransportOptions } from "#public/channels/slack/transport.js";
import type { SlackChannelConfig, SlackChannelState, SlackInteractionAction, SlackShortcut } from "#public/channels/slack/slackChannel.js";
import type { ChannelFrom, ChannelResolveSession } from "#channel/channel-operations.js";
/**
 * Decoded view of a Slack `block_actions` payload. Returned by
 * {@link parseBlockActionsPayload} and read by the handler.
 */
interface ParsedBlockActionsPayload {
    readonly actions: SlackInteractionAction[];
    readonly channelId: string;
    readonly installationTeamId: string | undefined;
    readonly threadTs: string;
    readonly teamId: string | undefined;
    /**
     * The full block list off the clicked message. Preserved on the
     * answered-card update so the original prompt stays visible after the
     * interactive controls are stripped.
     */
    readonly messageBlocks: readonly unknown[];
}
/**
 * Decodes a Slack `block_actions` payload into a {@link ParsedBlockActionsPayload}.
 * Returns `null` for payloads that don't carry the channel/thread
 * metadata the handler needs.
 */
export declare function parseBlockActionsPayload(body: Record<string, unknown> | SlackBlockActionsPayload): ParsedBlockActionsPayload | null;
/** Channel-supplied dependencies for {@link handleInteractionPost}. */
export interface InteractionHandlerDeps {
    readonly api: SlackTransportOptions | undefined;
    readonly config: SlackChannelConfig;
    readonly onAnswers: NonNullable<SlackChannelConfig["onAnswers"]>;
}
/**
 * Entry point for Slack's form-encoded interactivity endpoint. Routes
 * `view_submission` payloads to the freeform-answer flow, intercepts
 * "Type your answer" button clicks to open a modal, resolves
 * framework HITL clicks through `onAnswers` to the parked session,
 * forwards other block actions to `config.onInteraction`, shortcuts to
 * `config.onShortcut`, and slash commands to `config.onSlashCommand`.
 */
export declare function handleInteractionPost(rawBody: string, ctx: {
    from: ChannelFrom<SlackChannelState>;
    resolveSession: ChannelResolveSession;
    waitUntil: (task: Promise<unknown>) => void;
}, deps: InteractionHandlerDeps): Promise<Response>;
/** Normalizes Slack's two shortcut payload variants. */
export declare function parseShortcutPayload(raw: unknown): SlackShortcut | null;
export type { ParsedBlockActionsPayload };
