import type { SlackChannelInternalEvents, SlackContext } from "#public/channels/slack/slackChannel.js";
type ContentCompletedHandler = NonNullable<SlackChannelInternalEvents["content.completed"]>;
/**
 * A completed reply for {@link postCompletedSlackReply}: Markdown alone, or
 * Markdown with the Block Kit blocks to try first. `markdown` is the full
 * reply eve falls back to; `text` is the notification text for the blocks,
 * defaulting to `markdown`.
 */
export type SlackCompletedReply = string | {
    readonly markdown: string;
    readonly blocks?: readonly unknown[];
    readonly text?: string;
};
/**
 * Posts a completed reply to the bound Slack thread with eve's delivery
 * fallbacks, using only the content you pass. eve's default renderer posts
 * its replies through it; an authored renderer opts in by calling it instead
 * of `channel.thread.post`.
 *
 * eve tries, in order:
 *
 * 1. Your `blocks`, when given, with `text` as the notification text.
 * 2. `markdown` as one native Markdown message, when it fits in
 *    {@link SLACK_MARKDOWN_TEXT_MAX_LENGTH} characters. eve moves on from
 *    the blocks only when Slack refuses them as too large or malformed
 *    (`msg_too_long`, `msg_blocks_too_long`, `msg_blocks_too_many`,
 *    `invalid_blocks`, or `invalid_blocks_format`).
 * 3. `markdown` uploaded unchanged as an `eve-response.md` snippet with a
 *    short note, when it is longer or Slack refuses the Markdown message.
 *    This requires the `files:write` bot scope. In a session without a
 *    thread yet, the note posts first and anchors the thread.
 *
 * Before any of that, while eve has not yet posted in the thread, it checks
 * that the bound thread's root still exists. Slack posts a reply to a
 * deleted root as a top-level channel message, so eve drops the reply
 * instead of posting it unthreaded.
 *
 * Any other error, and a failed upload, is thrown so your renderer sees it.
 * eve logs each fallback it takes with Slack's error code, never the reply.
 *
 * @example
 * ```ts
 * import { postCompletedSlackReply } from "eve/channels/slack";
 *
 * await postCompletedSlackReply(channel, {
 *   blocks: [{ type: "markdown", text: reply }, sourcesBlock],
 *   markdown: reply,
 * });
 * ```
 */
export declare function postCompletedSlackReply(channel: SlackContext, reply: SlackCompletedReply): Promise<void>;
/**
 * {@link postCompletedSlackReply} with fields for its fallback log, such as
 * the turn id eve's default renderer knows.
 */
export declare function deliverCompletedSlackReply(channel: SlackContext, reply: SlackCompletedReply, logFields: {
    readonly turnId?: string;
}): Promise<void>;
/** Whether Slack's error `code` means it refused the message's content and posted nothing. */
export declare function isRefusedPayloadCode(code: unknown): code is string;
/** Slack's error code when `error` is a refused-payload error, checking its causes. */
export declare function refusedPayloadError(error: unknown): string | undefined;
/**
 * Wraps a channel's composed `content.completed` chain, authored renderers
 * included, so a final reply that fails is never lost without a trace.
 *
 * When the chain throws on a final reply, eve logs the error at error level,
 * posts a content-free notice with its error id, and tells the model on the
 * next delivery that its reply was not seen. eve never sends the reply from
 * here: the chain owns the content, including any change a renderer made
 * before `next`, and {@link postCompletedSlackReply} owns the fallbacks.
 * Narration, other content, and empty replies pass through.
 */
export declare function withFinalReplyDelivery(render: ContentCompletedHandler | undefined): ContentCompletedHandler;
export {};
