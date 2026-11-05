import type { Attachment, Message } from "#compiled/chat/index.js";
/** The adapter that owns the spectrum-ts app eve downloads attachments through. */
interface PhotonAdapter {
    readonly app: unknown;
    /** Asks Photon for the message by id; webhook deliveries are never cached, so this refetches. */
    fetchMessage(threadId: string, messageId: string): Promise<Message | null>;
    rehydrateAttachment?(attachment: Attachment): Attachment;
}
/**
 * Lets eve download each file a person sent over iMessage. The Spectrum
 * webhook lists an attachment's name and type but never its bytes, so this
 * records each attachment's id in its `fetchMetadata` and gives it a
 * `fetchData`; the channel downloads it later, in the step, through
 * {@link addPhotonAttachmentRehydration}. The webhook omits the id for some
 * files, such as voice notes, so those come from the message refetched by id.
 */
export declare function addPhotonAttachmentDownloads(message: Message, adapter: PhotonAdapter): Promise<void>;
/**
 * Gives the adapter a `rehydrateAttachment`, which the iMessage adapter lacks,
 * so the channel can rebuild an attachment's download from its `fetchMetadata`
 * after the message crosses the queue.
 */
export declare function addPhotonAttachmentRehydration(adapter: PhotonAdapter): void;
export {};
