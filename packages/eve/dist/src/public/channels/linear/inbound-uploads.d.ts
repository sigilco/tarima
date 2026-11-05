import type { MessageContent } from "#shared/message-content.js";
import type { LinearFetch } from "#public/channels/linear/api.js";
import { type LinearChannelCredentials } from "#public/channels/linear/auth.js";
/** One trusted Linear upload referenced by markdown image or link syntax. */
interface LinearUploadReference {
    readonly end: number;
    /** Whether markdown embeds it as an image, so only image bytes are accepted for it. */
    readonly image: boolean;
    readonly label: string;
    readonly start: number;
    readonly url: URL;
}
/** Extracts markdown images and links that target Linear's exact upload origin. */
export declare function extractLinearUploadReferences(markdown: string): readonly LinearUploadReference[];
/** Adds authenticated Linear uploads, images and other files, to otherwise text-only inbound content. */
export declare function attachLinearInboundUploads(input: {
    readonly content: MessageContent;
    readonly credentials?: LinearChannelCredentials;
    readonly fetch?: LinearFetch;
}): Promise<MessageContent>;
export {};
