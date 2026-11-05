import type { MessageContent } from "#shared/message-content.js";
import type { Attachment, Message } from "#compiled/chat/index.js";
import { type MessageLookup } from "#public/channels/chat-sdk/fetch-message.js";
import type { QuotedMessage } from "#public/channels/chat-sdk/reply-context.js";
/** Returns model-visible Linq content, or `undefined` for blank messages. */
export declare function linqInboundContent(message: Message): MessageContent | undefined;
/**
 * Returns the message a Linq reply quotes. The webhook names only the target's
 * id, so this fetches its text; a failed or slow lookup still reports the reply.
 */
export declare function linqQuotedMessage(adapter: MessageLookup, message: Message): Promise<QuotedMessage | undefined>;
/**
 * Rebuilds a Linq attachment's download after the message crosses the queue.
 * The Linq adapter downloads from its CDN URL without credentials but has no
 * `rehydrateAttachment`, so this does the same, stopping at the upload limit.
 */
export declare function rehydrateLinqAttachment(attachment: Attachment): Attachment;
