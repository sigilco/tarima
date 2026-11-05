import type { MessageContent } from "#shared/message-content.js";
import type { Message } from "#compiled/chat/index.js";
/**
 * Converts a Chat SDK `Message` into the input shape `chatSdkChannel().send`
 * accepts.
 *
 * Returns `message.text` when the message has no attachments. Otherwise
 * returns message parts: the text (when non-empty) followed by
 * one part per attachment.
 *
 * An attachment the adapter can download (`fetchData`) becomes a file part the
 * channel downloads later, in the step, with the adapter's credentials: a
 * platform's file URL usually needs them, so the model provider couldn't open
 * it. The channel rebuilds the download with the adapter's
 * `rehydrateAttachment`. A file over 25 MB, or one that fails to download,
 * reaches the agent as a short note. An attachment with only a URL is passed as
 * that URL. An attachment with neither also becomes a note, so a file the
 * platform gave no way to download is never dropped silently.
 */
export declare function messageContentOf(message: Message): MessageContent;
