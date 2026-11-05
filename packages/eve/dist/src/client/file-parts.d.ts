import type { MessageContent, MessageFilePart, MessagePart } from "#shared/message-content.js";
/**
 * Creates a `MessageFilePart` whose data is an inline `data:` URL.
 */
export declare function createDataUrlFilePart(input: {
    readonly bytes: Uint8Array;
    readonly filename?: string;
    readonly mediaType: string;
}): MessageFilePart;
/**
 * Builds one user turn containing text plus an inline file attachment.
 */
export declare function createTextWithFileContent(input: {
    readonly bytes: Uint8Array;
    readonly filename?: string;
    readonly mediaType: string;
    readonly text: string;
}): MessagePart[];
/**
 * A message as a request body carries it: a file part's bytes become a `data:` URL, since JSON
 * can't carry a `Uint8Array` or `ArrayBuffer`. A `URL` serializes as its string already.
 */
export declare function messageForRequest(message: MessageContent): MessageContent;
