# @tarima/telegram

The Tarima digest bot: grammY based commands (`/start`, `/bind`, `/status`, `/unbind`) plus a pure digest renderer. The api starts it on boot when `TELEGRAM_BOT_TOKEN` is set; without a token `createTelegramBot` returns null and the api runs Telegram-free.

## Rules

- MUST stay db-free: no drizzle, no sqlite, no `process.env` reads. Bindings and project rows arrive through the `BindingStore` and `DigestSource` seams. The api binds the store to sqlite later; this package ships only the in-memory implementation.
- `digestForProject` and `parseCommand` are pure: same input, same output, no clock, no network. Keep them that way; the tests rely on it.
- Digest output is plain text, never markdownV2: no parse mode, no escaping rules to drift. No em dashes anywhere.
- No db tables are created here. Binding persistence lives in the api.

## Exports

- `.`: `createTelegramBot`, `startLongPoll`, `handleCommand`, `parseCommand`, `usageText`, `digestForProject`, `DIGEST_MAX_ROWS`, `MemoryBindingStore`, plus the `TelegramConfig`, `DigestInput`, `DigestRow`, `DigestTotals`, `DigestSource`, `BindingStore`, `BotDeps` types.

## Testing

Vitest, catalog version, tests next to the code as `*.test.ts`. Command handling goes through `handleCommand` with a fake store and source; no live Telegram API is ever contacted.
