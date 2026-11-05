/**
 * Tarima Telegram channel (SP6, plan D11): eve's built-in telegram
 * channel wrapped with the EXISTING connect-code binding flow
 * (`telegram-bind.ts`).
 *
 * A Telegram chat maps to a tarima user through the `channel_bindings`
 * table (`channel='telegram'`, `external_id` = chat id). A chat that is
 * not yet bound sends `/start <CODE>` (or just the code), where CODE is
 * the 6-char code the settings page mints into `connect_codes`
 * (`@tarima/api/services/connect-codes`). The code resolves to a
 * `users.id`, the binding row is written, and from then on every
 * message from that chat runs as that user: `principalId = users.id`,
 * the SAME principal the browser session gets (`channels/eve.ts`), so
 * the audit mirror (`agent_events.principal_id`) attributes Telegram
 * turns to the same person.
 *
 * Unbound chats are refused with a helpful message (no session, no
 * model spend). No module-scope boot happens here: the channel only
 * declares a webhook route (`POST /eve/v1/telegram`), which eve serves
 * from its own listener — nothing polls or listens at import time.
 *
 * Transport seam for dev/testing without a real bot token: set
 * `TARIMA_TELEGRAM_API_BASE_URL` (passed as the channel's
 * `api.apiBaseUrl`) to point every Bot API call at a local fake, and
 * `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_SECRET_TOKEN` at throwaway
 * values (see `tests/turn/telegram-e2e.mjs`).
 */
import { telegramChannel } from "eve/channels/telegram";
import type { TelegramContext } from "eve/channels/telegram";
import type { TelegramMessage } from "eve/channels/telegram";
import { handleMessageText } from "../lib/telegram-bind";

/**
 * Inbound message hook: bind-or-authenticate, refusing unbound chats.
 * Returns the tarima SessionAuthContext for bound chats (so the turn
 * runs as the bound user), or null after answering the chat (no turn).
 */
const tarimaTelegramOnMessage = (ctx: TelegramContext, message: TelegramMessage) =>
  handleMessageText(message.chat.id, message.text, (text) => ctx.telegram.sendMessage(text));

/**
 * The channel. `route` keeps eve's default `/eve/v1/telegram` webhook;
 * `apiBaseUrl` lets tests/dev point the Bot API at a local fake
 * (`TARIMA_TELEGRAM_API_BASE_URL`). Credentials resolve from env:
 * TELEGRAM_BOT_TOKEN (outbound) and TELEGRAM_WEBHOOK_SECRET_TOKEN
 * (inbound header check) — never committed values.
 */
export default telegramChannel({
  api: process.env.TARIMA_TELEGRAM_API_BASE_URL
    ? { apiBaseUrl: process.env.TARIMA_TELEGRAM_API_BASE_URL }
    : undefined,
  onMessage: tarimaTelegramOnMessage,
});
