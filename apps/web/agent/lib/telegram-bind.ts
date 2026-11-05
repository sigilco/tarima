/**
 * Tarima Telegram binding logic (SP6, plan D11): chat id → tarima user
 * through the EXISTING `connect_codes` + `channel_bindings` tables —
 * no second binding system.
 *
 * A private chat maps 1:1 to a `channel_bindings` row
 * (`channel='telegram'`, `external_id` = chat id). Unbound chats send
 * `/start <CODE>` (or the bare code) minted by the settings page into
 * `connect_codes`; on success the binding is written and confirmed.
 * Everything here is synchronous sqlite + pure control flow, so the
 * unit test drives it with a capturing `send`.
 */
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@tarima/api/db";
import { channelBindings } from "@tarima/api/db/schema";
import { resolveConnectCode } from "@tarima/api/services/connect-codes";

const UNBOUND_HELP =
  "This chat isn't connected to a tarima account yet. Open tarima Settings → Connect Telegram to get a code, then send /start CODE here.";
const CODE_INVALID =
  "That connect code is invalid or expired. Open tarima Settings to get a fresh one, then send /start CODE.";
const CODE_OK = "Connected! This chat is now linked to your tarima account — just message me here.";

/** The tarima user bound to a telegram chat id, or undefined. */
export function boundUserId(chatId: string): string | undefined {
  return db
    .select({ userId: channelBindings.userId })
    .from(channelBindings)
    .where(and(eq(channelBindings.channel, "telegram"), eq(channelBindings.externalId, chatId)))
    .get()?.userId;
}

/** Bind (or rebind) a chat to a user; one row per chat. */
export function bindChatId(chatId: string, userId: string): void {
  const existing = boundUserId(chatId);
  if (existing === userId) return;
  if (existing !== undefined) {
    db.update(channelBindings)
      .set({ userId })
      .where(and(eq(channelBindings.channel, "telegram"), eq(channelBindings.externalId, chatId)))
      .run();
    return;
  }
  db.insert(channelBindings)
    .values({ id: randomUUID(), userId, channel: "telegram", externalId: chatId })
    .run();
}

/** The connect code inside a message: `/start CODE` or a bare code. */
function codeInText(text: string): string {
  if (text.startsWith("/start")) return text.slice("/start".length).trim();
  return /^[A-Z2-9]{6}$/.test(text) ? text : "";
}

/**
 * One inbound text message. Sends the reply via `send` (refusal or
 * connect confirmation) and returns the SessionAuthContext for bound
 * chats, or null when the message must not open an agent turn.
 */
export async function handleMessageText(
  chatId: string,
  text: string,
  send: (message: string) => Promise<unknown>,
): Promise<{
  auth: {
    authenticator: string;
    principalId: string;
    principalType: string;
    attributes: Record<string, string>;
  };
} | null> {
  const code = codeInText(text.trim());
  if (code) {
    const resolved = resolveConnectCode(db, "telegram", code);
    if (!resolved.ok) {
      await send(CODE_INVALID);
      return null;
    }
    bindChatId(chatId, resolved.userId);
    await send(CODE_OK);
    return null;
  }

  const userId = boundUserId(chatId);
  if (!userId) {
    await send(UNBOUND_HELP);
    return null;
  }

  return {
    auth: {
      authenticator: "tarima-telegram-binding",
      principalId: userId,
      principalType: "user",
      attributes: { channel: "telegram", chatId },
    },
  };
}
