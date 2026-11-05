import type { MessageContent, MessageFilePart } from "#shared/message-content.js";
import type { FetchFileContext, FetchFileResult } from "#channel/adapter.js";
import { type SlackBotToken, type SlackThread, type SlackThreadMessage } from "#public/channels/slack/api.js";
import { type SlackAttachment, type SlackMessage } from "#public/channels/slack/inbound.js";
import { type SlackTransportOptions } from "#public/channels/slack/transport.js";
import { type UploadPolicy } from "#public/channels/upload-policy.js";
/**
 * Emits one {@link MessageFilePart} per attachment in the inbound message, with
 * `data` set to a `URL` object pointing at the Slack file. URL-less and
 * policy-violating attachments are dropped so a single bad upload never
 * blocks the text portion.
 *
 * The `URL` object in `data` is resolved by the channel's `fetchFile`
 * function at staging time inside the workflow step.
 */
export declare function collectSlackFileParts(attachments: readonly SlackAttachment[] | undefined, policy: UploadPolicy): MessageFilePart[];
/**
 * Collects file parts for an inbound message.
 *
 * Prefers attachments on the triggering message (the common case: a person
 * uploads a file and mentions the app in the same message). When a mention
 * carries none, refreshes the thread via {@link SlackThread.refresh} and
 * collects, in thread order, the files of the messages between the previous
 * mention of the app and the trigger, up to {@link THREAD_LOOKBACK_MESSAGES}
 * messages back. When the cached replies don't reach the trigger, as in a
 * thread past Slack's first page, the window ending at the trigger is
 * fetched; a trigger neither returns gets no lookback.
 * That earlier mention started its own turn, which collected the files before
 * it. The app's own messages and remote files are skipped. A message that
 * didn't mention the app gets no lookback: the app answers every message in
 * that conversation, so each earlier message brought its own files.
 *
 * Any error during refresh is logged and treated as "no attachments" so the
 * text portion of the message still gets delivered. Skips the lookback when
 * the policy disables uploads, since the refresh can't surface anything we'd
 * deliver.
 */
export declare function collectInboundFileParts(input: {
    readonly mention: Pick<SlackMessage, "attachments" | "ts">;
    readonly thread: SlackThread;
    readonly policy: UploadPolicy;
    /** Whether the triggering message mentions the app. */
    readonly isMentioned: boolean;
    readonly botUserId: string | undefined;
    /** Fetches the `size` thread messages ending at `latest`, oldest first. */
    readonly fetchThreadWindow?: (latest: string, size: number) => Promise<readonly SlackThreadMessage[] | undefined>;
}): Promise<MessageFilePart[]>;
/**
 * Combines text + file parts into the {@link MessageContent} shape the
 * harness expects. Returns the raw text string when there are no
 * parts (the common path).
 */
export declare function buildSlackTurnMessage(text: string, fileParts: readonly MessageFilePart[]): MessageContent;
/**
 * Creates a `fetchFile` function for the Slack channel.
 *
 * Returns `null` for URLs that don't belong to Slack so they pass
 * through to the model provider unchanged. Fetches Slack file URLs, and
 * URLs under a configured `api.fileBaseUrl`, with the bot token, on
 * `api.fetch` when one is configured.
 */
export declare function createSlackFetchFile(input: {
    readonly api?: SlackTransportOptions;
    readonly botToken?: SlackBotToken;
    /** Downloads stop at this many bytes. Defaults to the framework's 25 MB. */
    readonly maxBytes?: number;
}): (url: string, context?: FetchFileContext) => Promise<FetchFileResult | null>;
