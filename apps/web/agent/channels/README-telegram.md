# Telegram channel (SP6) — eve built-in surface + tarima binding

eve ships a native Telegram channel (webhook-based). We wrap it with
tarima's existing connect-code binding instead of a bespoke bot.

## Option shape — `TelegramChannelConfig`

`packages/eve/dist/src/public/channels/telegram/telegramChannel.d.ts`:

- `credentials.botToken` — string or async provider
  (`credentials.d.ts`, `api.d.ts:TelegramBotToken`; falls back to
  `process.env.TELEGRAM_BOT_TOKEN`, `api.js:resolveTelegramBotToken`).
- `credentials.webhookSecretToken` — `X-Telegram-Bot-Api-Secret-Token`
  header verified constant-time (`verify.d.ts/.js`); falls back to
  `TELEGRAM_WEBHOOK_SECRET_TOKEN`. Or a custom `webhookVerifier`.
- `api.apiBaseUrl` / `api.fetch` — transport overrides. **This is the
  fake-Telegram seam**: pointing `apiBaseUrl` at a local server makes
  every Bot API call (`sendMessage`, `sendChatAction`,
  `answerCallbackQuery`, `editMessageText`, `getFile`) hit it
  (`api.d.ts`, `telegramChannel.js:buildTelegramHandle`).
- `route` — webhook path, default `/eve/v1/telegram` (`telegramChannel.d.ts`).
  Registered as `POST` route by `defineChannel` in `telegramChannel.js`.
- `onMessage(ctx, message) -> TelegramInboundResult | null` — return
  `{ auth: SessionAuthContext | null, context?, history?, title? }`
  or `null` to drop (`telegramChannel.d.ts`). `null` drops silently —
  so unbound chats must be answered via `ctx.telegram.sendMessage`.
- `onCallbackQuery`, `events` (per-event handlers incl. HITL), `botUsername`,
  `turnPolicy`, `uploadPolicy`.

## Chat → session mapping

State `TelegramChannelState` carries `chatId`, `chatType`,
`conversationId`, `messageThreadId` (`telegramChannel.d.ts`); the
session continuation token is `chatId:messageThreadId:conversationId`
(`api.js:telegramContinuationToken`). One private chat = one session.
Context block (chat id/type/user) is prepended by
`formatTelegramContextBlock` (`inbound.js`).

## Auth story (ours)

`channels/telegram.ts` sets `onMessage`:

1. Look up `channel_bindings` row for `channel='telegram'`,
   `external_id=<chat.id>` (`apps/api/src/db/schema.ts`). Found →
   `SessionAuthContext{ principalId: row.userId }` — the SAME
   `users.id` the browser session puts in `principalId`
   (`channels/eve.ts`), so the mirror (`agent_events.principal_id`)
   attributes Telegram turns to the same person.
2. `/start <CODE>` (or a bare code message): resolve via
   `resolveConnectCode(db, 'telegram', code)` (`apps/api/src/services/
   connect-codes.ts`) → insert the `channel_bindings` row → confirm
   in-chat. Reuses the existing flow; no second binding system.
3. Otherwise: helpful refusal with connect instructions via
   `ctx.telegram.sendMessage`, return `null`.

Inbound verification: dev/testing uses a fixed
`TELEGRAM_WEBHOOK_SECRET_TOKEN` (env, never committed); prod sets the
same value on Telegram's `setWebhook`.

## Driving without real credentials

Set `TARIMA_TELEGRAM_API_BASE_URL` (e.g. `http://127.0.0.1:<port>`) —
passed as `api.apiBaseUrl` — and POST Telegram-shaped updates at
`POST /eve/v1/telegram` with the secret header. A tiny fake Bot API
server asserts the outbound `sendMessage`. The channel is webhook-only
(polling is not implemented in the vendored dist — no `getUpdates`
call site in `packages/eve/dist/src/public/channels/telegram/`).
