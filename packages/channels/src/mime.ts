import PostalMime from "postal-mime";
import type { Attachment } from "./types";

/** What parseMime returns: the channel-neutral subset of a parsed email. */
export interface ParsedMime {
  /**
   * Best address to resume the thread on. The `to` address wins because
   * chase replies land on a per-row address, which is what identifies the
   * row. Reply-To and From are fallbacks.
   */
  threadId: string;
  from: string;
  to: string;
  replyTo?: string;
  subject?: string;
  text?: string;
  html?: string;
  attachments: Attachment[];
  messageId?: string;
  /** The full postal-mime parse, kept for debugging and future fields. */
  raw: unknown;
}

function firstAddress(value: { address?: string } | { address?: string }[] | undefined): string {
  if (!value) return "";
  const first = Array.isArray(value) ? value[0] : value;
  return first?.address ?? "";
}

function toBytes(content: ArrayBuffer | Uint8Array | string): Buffer {
  if (typeof content === "string") return Buffer.from(content, "utf8");
  if (content instanceof Uint8Array) return Buffer.from(content);
  return Buffer.from(new Uint8Array(content));
}

/**
 * Parse a raw RFC 5322 message. `threadId` prefers the `to` address so a
 * chase reply lands on the row that sent it even when the sender's client
 * rewrites From (mailing lists, forwarded threads).
 */
export async function parseMime(raw: string | Uint8Array): Promise<ParsedMime> {
  const email = await PostalMime.parse(raw);
  const from = firstAddress(email.from);
  const to = firstAddress(email.to);
  const replyTo = firstAddress(email.replyTo);
  const attachments: Attachment[] = email.attachments.map((a) => ({
    filename: a.filename ?? "attachment",
    mimeType: a.mimeType,
    bytes: toBytes(a.content),
  }));
  return {
    threadId: to || replyTo || from,
    from,
    to,
    replyTo: replyTo || undefined,
    subject: email.subject,
    text: email.text?.trim() ? email.text.trim() : undefined,
    html: email.html ?? undefined,
    attachments,
    messageId: email.messageId,
    raw: email,
  };
}
