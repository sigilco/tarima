import type { MessageContent } from "#shared/message-content.js";
import type { SendPayload } from "#channel/routes.js";
/** Normalizes the shorthand input forms accepted by channel and session sends. */
export declare function normalizeSendInput(input: MessageContent | SendPayload): SendPayload;
/**
 * Serializes file parts before input crosses the durable boundary: `URL`s
 * become `eve-url:` markers and bytes become `data:` URLs, so no world
 * serializer has to round-trip a `URL` or a typed array.
 */
export declare function serializeFilePartsInMessage(message: MessageContent | undefined): MessageContent | undefined;
