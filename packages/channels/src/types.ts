/**
 * The ChannelAdapter contract. One thin interface per channel so the engine
 * and the chase pipeline never learn the shape of a provider.
 */

export type ChannelId = "email" | "whatsapp" | "telegram" | "inapp";

export interface Attachment {
  filename: string;
  mimeType?: string;
  bytes: Buffer;
}

export interface OutboundMessage {
  channel: ChannelId;
  /** Email address, e164 phone number, or chat id. */
  to: string;
  /** Email only. */
  subject?: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: Attachment[];
  /** Per-channel extra data (e.g. a WhatsApp template name). */
  meta?: Record<string, unknown>;
}

export interface InboundMessage {
  channel: ChannelId;
  /** WhatsApp wa_id, telegram chat id, or the email reply-to address. */
  threadId: string;
  from: string;
  subject?: string;
  text?: string;
  attachments?: Attachment[];
  /** Original payload, kept for debugging. */
  raw: unknown;
}

export interface SendResult {
  /** Provider-side id of the accepted message. */
  externalId: string;
  /** Provider name that handled the send ("brevo", "whatsapp", "loopback"). */
  provider: string;
  accepted: boolean;
  /** Why the send was refused. The outbox dispatcher decides retry vs dead-letter. */
  reason?: string;
}

export interface ChannelAdapter {
  id: ChannelId;
  send(msg: OutboundMessage): Promise<SendResult>;
  /** Verify a webhook signature or secret for this channel. */
  verifyWebhook(req: Request): boolean;
  /** Normalize an inbound webhook request into an InboundMessage. */
  parseInbound(req: Request): Promise<InboundMessage | null>;
}
