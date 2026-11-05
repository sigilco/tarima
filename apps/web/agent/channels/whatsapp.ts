/**
 * Tarima WhatsApp channel (W3): the Meta Cloud API through the Chat SDK
 * `@chat-adapter/whatsapp` adapter wrapped by eve's `chatSdkChannel`
 * (the kody-eve-template pattern), replacing the hand-rolled SP6-B
 * channel in `@tarima/channels`.
 *
 * Identity: the sender's WhatsApp id (`message.author.userId`, the phone
 * number or BSUID the adapter resolved) maps to a tarima user through
 * the EXISTING `channel_bindings` + `connect_codes` flow — the same
 * helper the telegram channel uses (`lib/telegram-bind.ts`'s message
 * logic, bound to channel "whatsapp"). Bound numbers open turns as
 * `principalId = users.id` (the browser principal), so the audit mirror
 * attributes WhatsApp turns to the same person.
 *
 * STRANGERS (numbers that are not bound): answered once with the bind
 * instructions, no session, no model spend, no memory — and a connect
 * code in the message still binds the chat, exactly like telegram.
 *
 * Idempotency and durability are Chat SDK's, backed by our SQLite
 * `StateAdapter` (`lib/chat-state-sqlite.ts`): a re-delivered webhook
 * with the same `wamid.*` message id is processed once (per-message
 * dedupe key in state), and per-channel locks + thread state survive a
 * restart. Replies are delivered once per completed turn (`streaming:
 * false` — WhatsApp cannot edit messages, so streaming would post
 * repeatedly) and the adapter auto-chunks long replies at 4096 chars.
 *
 * Mock/dev seam: `WHATSAPP_API_BASE_URL` overrides the Graph API origin
 * the adapter fetches (mapped to the adapter's `apiUrl` option; the
 * adapter's own WHATSAPP_API_URL env var still works when set). The
 * mock Graph server
 * (`tests/mocks/whatsapp-mock.mjs`) answers the exact
 * `POST /<version>/<phoneNumberId>/messages` shape.
 *
 * Credentials resolve from env: WHATSAPP_ACCESS_TOKEN,
 * WHATSAPP_APP_SECRET, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN
 * (see `.agents/docs/whatsapp-cloud-notes.md`: the 24h customer-service
 * window still applies — the bind message opens it, so replies to bound
 * users are always free-form-eligible; media inbound is parsed by the
 * adapter into attachments without custom code).
 *
 * No module-scope boot: the channel only declares its webhook route,
 * which eve serves from its own listener.
 */
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { chatSdkChannel } from "eve/channels/chat-sdk";
import type { Message, Thread } from "chat";
import { rawDatabase } from "@tarima/api/db";
import { createSqliteState } from "../lib/chat-state-sqlite";
import { handleMessageText } from "../lib/whatsapp-bind";

/** The session-auth fields a bound sender's turn carries. */
interface TarimaSessionAuth {
  authenticator: string;
  principalId: string;
  principalType: string;
  attributes: Record<string, string>;
}

/**
 * Bind-or-authenticate for one inbound message: strangers and bind
 * confirmations are answered in-thread and open no turn (`null`);
 * bound senders get the tarima session auth for the turn.
 */
async function tarimaAuth(thread: Thread, message: Message): Promise<TarimaSessionAuth | null> {
  const result = await handleMessageText({
    channel: "whatsapp",
    externalId: message.author.userId,
    text: message.text ?? "",
    // Answer on the inbound thread itself: `bot.openDM` cannot infer the
    // whatsapp adapter from a phone-number userId.
    reply: (text) => thread.post(text),
  });
  if (result.kind === "reply") return null;
  return {
    authenticator: result.auth.authenticator,
    principalId: result.auth.principalId,
    principalType: result.auth.principalType,
    attributes: result.auth.attributes,
  };
}

// The repo-wide seam name (scripts/dev.ts, .env.example) maps onto the
// adapter's `apiUrl`; the adapter's own WHATSAPP_API_URL still wins if set.
const apiUrl = process.env.WHATSAPP_API_URL ?? process.env.WHATSAPP_API_BASE_URL;

const adapter = createWhatsAppAdapter({
  apiUrl,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "tarima-dev-access-token",
  appSecret: process.env.WHATSAPP_APP_SECRET ?? "tarima-dev-app-secret",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "123456789",
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "tarima-dev-verify-token",
  userName: process.env.WHATSAPP_BOT_USERNAME ?? "tarima",
});

const bridge = chatSdkChannel({
  userName: process.env.WHATSAPP_BOT_USERNAME ?? "tarima",
  adapters: { whatsapp: adapter },
  // Locks, per-message dedupe (idempotency by wamid) and thread state.
  state: createSqliteState({ database: rawDatabase() }),
  // WhatsApp cannot edit delivered messages: post the reply once,
  // complete, chunked by the adapter.
  streaming: false,
  turnPolicy: "queue",
});

const { bot, channel, send } = bridge;

/**
 * Inbound DM handler: bind-or-refuse, then hand the turn to eve with the
 * bound user as principal. Strangers get the connect notice and open no
 * turn — no session, no model spend, no memory.
 */
bot.onDirectMessage(async (thread: Thread, message: Message) => {
  const auth = await tarimaAuth(thread, message);
  if (!auth) return; // the bind helper already answered in-thread
  await send(message.text ?? "", { thread, auth });
});

export default channel;
