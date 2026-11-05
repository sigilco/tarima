import type { Attachment } from "#compiled/chat/index.js";
/**
 * URL protocol for a Chat SDK attachment the adapter downloads. The URL names
 * the adapter and carries the attachment's serializable fields, so the
 * channel's `fetchFile` can rebuild the download with the adapter's
 * `rehydrateAttachment` in the step, after the message crosses the queue.
 */
export declare const CHAT_SDK_FILE_PROTOCOL = "chat-sdk-file:";
/** The serializable part of an attachment, as Chat SDK's `Message.toJSON` keeps it. */
export interface ChatSdkFileRef {
    readonly adapter: string;
    readonly attachment: Pick<Attachment, "fetchMetadata" | "mimeType" | "name" | "size" | "type" | "url">;
}
export declare function encodeChatSdkFileRef(ref: ChatSdkFileRef): URL;
export declare function parseChatSdkFileRef(url: URL): ChatSdkFileRef | null;
