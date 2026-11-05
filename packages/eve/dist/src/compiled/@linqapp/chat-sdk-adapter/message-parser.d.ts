import { LinqAPIV3 } from "@linqapp/sdk";
import { Message } from "#compiled/chat/index.js";
type LinqMessageSendResponse = Awaited<ReturnType<LinqAPIV3["chats"]["messages"]["send"]>>;
type LinqRetrievedMessage = LinqAPIV3.Message;
export type LinqRawMessage = LinqAPIV3.UnwrapWebhookEvent["data"] | LinqMessageSendResponse | LinqRetrievedMessage;
type LinqThreadId = {
    chatId: string;
    isGroup?: boolean;
};
export declare function parseLinqMessage(raw: LinqRawMessage, encodeThreadId: (platformData: LinqThreadId) => string): Message<LinqRawMessage>;
export declare function isMessageReceivedWebhookEvent(event: LinqAPIV3.UnwrapWebhookEvent): event is LinqAPIV3.Webhooks.MessageReceivedWebhookEvent;
export declare function isReactionWebhookEvent(event: LinqAPIV3.UnwrapWebhookEvent): event is LinqAPIV3.Webhooks.ReactionAddedWebhookEvent | LinqAPIV3.Webhooks.ReactionRemovedWebhookEvent;
export {};
//# sourceMappingURL=message-parser.d.ts.map