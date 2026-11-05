import type { MessageContent } from "#shared/message-content.js";
import type { Message } from "#compiled/chat/index.js";
import type { QuotedMessage } from "#public/channels/chat-sdk/reply-context.js";
/** Returns model-visible Photon content, or `undefined` for non-message events. */
export declare function photonInboundContent(message: Message): MessageContent | undefined;
/**
 * Returns the message a Photon iMessage reply quotes. The adapter flattens a
 * reply to its new text, so this reads the target from the raw message. Only a
 * gateway delivery says who sent the target, through its `direction`.
 */
export declare function photonQuotedMessage(message: Message): QuotedMessage | undefined;
