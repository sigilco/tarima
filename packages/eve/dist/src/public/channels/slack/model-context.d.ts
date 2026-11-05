import type { SlackThreadMessage } from "#public/channels/slack/api.js";
import type { SlackInboundContext } from "#public/channels/slack/inbound.js";
import type { SlackUserInfo } from "#public/channels/slack/user-info.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
/** Renders the triggering inbound Slack message as one attributed block. */
export declare function formatSlackInboundMessage(context: SlackInboundContext, message: InboundMessageInput): string;
/**
 * Renders an edited Slack message as a `<slack_message_edit>` block: the line
 * changes in `<diff>`, and the full edited text in `<content>`. Without the
 * previous text, or when the message is too long to compare, `<edit>` says why
 * there is no diff, so the model still reads it as an edit.
 */
export declare function formatSlackInboundMessageEdit(context: SlackInboundContext, edit: InboundMessageInput & {
    readonly previousText: string | undefined;
    readonly editedTs: string;
}): string;
interface InboundMessageInput {
    readonly text: string;
    readonly ts: string;
    /** Trusted text from the message hook; never user-controlled. */
    readonly guidance?: string;
}
/**
 * Renders fetched Slack replies as explicitly attributed background context.
 * Returns `undefined` when there are no messages to add to the turn.
 */
export declare function formatSlackThreadContext(messages: readonly SlackThreadMessage[], users?: ReadonlyMap<string, SlackUserInfo>): string | undefined;
/**
 * Maps fetched thread replies to seeded session history. This app's own replies become assistant
 * turns; everyone else stays an attributed user message. Slack shows rendered output, so assistant
 * turns approximate what the model said.
 */
export declare function slackThreadSessionHistory(messages: readonly SlackThreadMessage[], users?: ReadonlyMap<string, SlackUserInfo>): SessionHistoryMessage[];
export {};
