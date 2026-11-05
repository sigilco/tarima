import type { Message } from "#compiled/chat/index.js";
/** The slice of a Chat SDK adapter that fetches one message by id. */
export interface MessageLookup {
    fetchMessage?(threadId: string, messageId: string): Promise<Message | null>;
}
/**
 * Fetches a message by id, or returns `null` when the adapter can't, the
 * lookup fails, or it takes longer than a few seconds.
 */
export declare function fetchMessageBestEffort(adapter: MessageLookup, threadId: string, messageId: string): Promise<Message | null>;
