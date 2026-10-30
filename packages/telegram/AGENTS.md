# @tarima/telegram

The Tarima digest bot: grammY based commands (`/start`, `/start <code>`, `/bind`, `/status`, `/unbind`) plus a pure digest renderer. The api starts it on boot when `TELEGRAM_BOT_TOKEN` is set; without a token `createTelegramBot` returns null and the api runs Telegram-free.

## Rules

- MUST stay db-free: no drizzle, no sqlite, no `process.env` reads. Bindings and project rows arrive through the `BindingStore` and `DigestSource` seams. The api binds the store to sqlite (`SqliteBindingStore` in `apps/api/src/services/telegram-bindings.ts`); this package ships only the in-memory implementation.
- The connect flow arrives through the optional `ConnectResolver` seam: the package never sees the code store, it only passes the code up and returns the confirmation line. A 6 character argument is treated as a code, not as a project id.
- `digestForProject` and `parseCommand` are pure: same input, same output, no clock, no network. Keep them that way; the tests rely on it.
- Digest output is plain text, never markdownV2: no parse mode, no escaping rules to drift. No em dashes anywhere.
- No db tables are created here. Binding persistence lives in the api.

## Exports

- `.`: `createTelegram`, `createTelegramBot`, `createTelegramHandle`, `startLongPoll`, `handleCommand`, `parseCommand`, `usageText`, `digestForProject`, `DIGEST_MAX_ROWS`, `MemoryBindingStore`, plus the `TelegramConfig`, `TelegramBot`, `DigestInput`, `DigestRow`, `DigestTotals`, `DigestSource`, `BindingStore`, `BotDeps`, `ConnectResolver` types.

## Pushing digests

`createTelegram(config, deps)` returns a `TelegramBot` handle or null. The handle exposes `pushDigest(projectId)`: it reads the digest through the injected source and sends it, one chat at a time, to every chat the store has bound to that project. A chat whose send fails is logged and skipped. The api calls this from its cron or workflow hooks after the board changes.

## Sending one message

`TelegramBot.send(chatId, text)` sends a plain message to one chat. The api's notify fanout uses it to deliver a notification to a chat the user bound. It throws when the send fails, so the fanout can count the failure.

## Testing

Vitest, catalog version, tests next to the code as `*.test.ts`. Command handling goes through `handleCommand` with a fake store and source; no live Telegram API is ever contacted.
