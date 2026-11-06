/**
 * Tarima WhatsApp binding logic (W3): a WhatsApp sender id (phone
 * number or BSUID) → tarima user through the EXISTING `connect_codes` +
 * `channel_bindings` tables — the same flow the telegram channel uses,
 * on channel "whatsapp".
 *
 * A direct chat maps 1:1 to a `channel_bindings` row
 * (`channel='whatsapp'`, `external_id` = sender id). Unbound numbers are
 * STRANGERS: they get the connect instructions as a plain reply and open
 * no agent turn (no session, no model spend, no memory — the eve session
 * simply never starts). A connect code in the message
 * (`/start CODE` or the bare 6-char code) binds the number and confirms.
 *
 * Extracted as a pure control-flow helper so the unit test drives it
 * with a capturing `send`, exactly like `telegram-bind.ts`.
 */
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@tarima/api/db";
import { channelBindings } from "@tarima/api/db/schema";
import { resolveConnectCode } from "@tarima/api/services/connect-codes";

const STRANGER_NOTICE =
  "This number isn't connected to a tarima account yet. Open tarima Settings → Connect WhatsApp to get a code, then send /start CODE here.";
const CODE_INVALID =
  "That connect code is invalid or expired. Open tarima Settings to get a fresh one, then send /start CODE.";
const CODE_OK =
  "Connected! This number is now linked to your tarima account — just message me here.";

/** The tarima user bound to a WhatsApp sender id, or undefined. */
export function boundWhatsappUserId(externalId: string): string | undefined {
  return db
    .select({ userId: channelBindings.userId })
    .from(channelBindings)
    .where(and(eq(channelBindings.channel, "whatsapp"), eq(channelBindings.externalId, externalId)))
    .get()?.userId;
}

/** Bind (or rebind) a WhatsApp sender id to a user; one row per sender. */
export function bindWhatsappUser(externalId: string, userId: string): void {
  const existing = boundWhatsappUserId(externalId);
  if (existing === userId) return;
  if (existing !== undefined) {
    db.update(channelBindings)
      .set({ userId })
      .where(
        and(eq(channelBindings.channel, "whatsapp"), eq(channelBindings.externalId, externalId)),
      )
      .run();
    return;
  }
  db.insert(channelBindings)
    .values({ id: randomUUID(), userId, channel: "whatsapp", externalId })
    .run();
}

/** The connect code inside a message: `/start CODE` or a bare code. */
function codeInText(text: string): string {
  if (text.startsWith("/start")) return text.slice("/start".length).trim();
  return /^[A-Z2-9]{6}$/.test(text) ? text : "";
}

export type WhatsappAuthResult =
  | { kind: "reply" }
  | {
      kind: "auth";
      auth: {
        authenticator: string;
        principalId: string;
        principalType: string;
        attributes: Record<string, string>;
      };
    };

/**
 * One inbound text message. Sends the reply via `send` (stranger notice
 * or connect confirmation) and returns the SessionAuthContext fields for
 * bound senders, or `{ kind: "reply" }` when the message must not open
 * an agent turn.
 */
export async function handleMessageText(input: {
  channel: "whatsapp";
  externalId: string;
  text: string;
  reply: (message: string) => Promise<unknown>;
}): Promise<WhatsappAuthResult> {
  const { externalId, text, reply } = input;
  const code = codeInText(text.trim());
  if (code) {
    const resolved = resolveConnectCode(db, "whatsapp", code);
    if (!resolved.ok) {
      await reply(CODE_INVALID);
      return { kind: "reply" };
    }
    bindWhatsappUser(externalId, resolved.userId);
    await reply(CODE_OK);
    return { kind: "reply" };
  }

  const userId = boundWhatsappUserId(externalId);
  if (!userId) {
    await reply(STRANGER_NOTICE);
    return { kind: "reply" };
  }

  return {
    kind: "auth",
    auth: {
      authenticator: "tarima-whatsapp-binding",
      principalId: userId,
      principalType: "user",
      attributes: { channel: "whatsapp", externalId },
    },
  };
}
