# Stream B: channels (Telegram + WhatsApp hardening)

Branch: `beta/b-channels`, based on `origin/beta/contract-freeze` at `d060645`.

The agent reports to the user where they already are: the in-app inbox, Telegram, WhatsApp. Bindings are persisted, so a restart no longer loses them.

## What shipped

### Persisted bindings

`SqliteBindingStore` (`apps/api/src/services/telegram-bindings.ts`) replaces the in-memory `MemoryBindingStore` the api used. The chat to project binding lives in `channel_bindings` (the contract's table), so a restart keeps it.

One row carries both bindings of a chat: `user_id` is the account the chat belongs to (the connect flow writes it), `label` is `project:<projectId>` when the chat also wants that project's digest. The unique index on `(channel, external_id)` allows exactly one row per endpoint, so the two bindings share it. Unbinding a project clears the label instead of deleting the row, otherwise the notification binding would go with it.

### The connect flow

1. The settings page (`/app/settings`) mints a 6 character code for a channel (`POST /api/ui/settings/connect-code`). The code is stored hashed (sha256), expires after `CONNECT_CODE_TTL_SEC` (15 min, the contract freeze) and is single use: resolving it marks the row consumed.
2. The tester sends `/start <code>` to the Telegram bot, or the code as a plain message to the WhatsApp number.
3. The webhook resolves the code, writes the `channel_bindings` row and confirms in-chat ("Connected. This chat now gets your Tarima notifications.").

The Telegram side runs through the package's `ConnectResolver` seam (`packages/telegram/src/bot.ts`): the package never sees the code store, it passes the code up and returns the confirmation line. The WhatsApp side runs in `apps/api/src/routes/webhooks.ts`.

The code alphabet avoids lookalike characters (no 0/O, 1/I/L), so a code read off a phone screen can be typed back without mistakes.

### The notify fanout

`apps/api/src/services/notify.ts` is the single place that knows the fan shape. It consumes the contract's `notifyPayloadSchema`, writes the in-app copy first and then delivers to every bound channel (Telegram, WhatsApp). A channel that refuses is counted and logged, never thrown, so one dead number cannot abort the fanout.

The engine's `notify` outbox effect and the board's status-change event both route through it. The chase handler today emits only a run id, so `payloadFromEffect` translates that into a contract payload from the run's entity.

Copy rule: the payload's `summary` is the first line the user reads. It is delivered unchanged, with no prefix and no label in front of it.

### The in-app inbox

**Storage choice: a new `user_messages` table (migration `0004_stage_b_channels`), not the `events` table.** The reasons:

- `events` is an append-only audit trail with no owner-scoped read path: its rows are read by the board's SSE stream through a subject-based scope, not by a user id. The inbox needs a user scope.
- `events` has no read state. The inbox needs an unread counter, which means a `read_at` column on a per-user row.
- `events` is shared with the engine's audit writes. Mixing user-facing messages into it would make every consumer of the audit trail filter them out again.

The new table is additive: the frozen contract (`packages/contract`, `apps/api/src/db/schema.ts` for the frozen tables, migration `0003`) is untouched. The only schema addition is a table that nothing else in the codebase reads yet.

### The settings page and the board panel

`/app/settings` shows the connect codes, the bound channels and the notifications, with a disconnect button. The board page gets a minimal inbox panel (unread counter plus the last five messages). There is no chat UI: that is post-beta.

### The WhatsApp constraints

Handled explicitly, see `.agents/docs/whatsapp-cloud-notes.md`:

- The test number allows 5 recipients, so every tester who connects a number must be added as a test recipient first.
- The tester must message first. The Cloud API only accepts free-form text inside the 24 hour customer service window, and the connect code arrives as an inbound message, so the window is open by the time the first notification goes out.
- The template application path is documented as a followup. It is not blocking the beta: the fanout only reaches a number inside the 24 hour window, which is enough for the testers who connect during the session.

## Tests

- `apps/api/src/services/connect-codes.test.ts`: the code shape, the hashed storage, the TTL, the single use, the channel scoping.
- `apps/api/src/services/bindings.test.ts`: bind, rebind, move between users, unbind.
- `apps/api/src/services/notify.test.ts`: the fanout, the in-app copy, the failure policy, the payload translation.
- `apps/api/src/services/notify-loopback.test.ts`: the fanout over a loopback channel (the seam the live phone gates stand in for).
- `apps/api/src/services/telegram-bindings.test.ts`: the sqlite store, including that a binding survives a reopen.
- `apps/api/src/services/messages.ts` (read side of the inbox) is covered by `apps/api/src/routes/settings.test.ts`.
- `apps/api/src/routes/webhooks.test.ts`: the WhatsApp connect flow (binds, does not bind without a code, the code is consumed).
- `packages/telegram/src/bot.test.ts`: the connect seam (the `/start <code>`, the bare code, the invalid code, the project bind still working).

## Live gates (not run, for the orchestrator)

The live phone gates cannot run on the VPS. They are implemented and unit tested, but the real-phone checks are still open:

1. Telegram ping received on a real phone.
2. WhatsApp test send received on a real phone (inside the 24 hour window).
3. An inbound "hi" creates a binding and the confirmation comes back.

## Secrets

`TELEGRAM_BOT_TOKEN`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` are not in `deploy/secrets-manifest.toml` yet: that file belongs to the deploy stream. The exact additive change is written out in `.agents/docs/whatsapp-cloud-notes.md` ("Secrets the deploy needs"). Without them the api still boots: the Telegram bot is a no-op without its token and the WhatsApp adapter refuses its sends.

## Contract changes

Additive only, and only in the api's own schema:

- `apps/api/src/db/schema.ts`: the new `user_messages` table (with its two indexes).
- `apps/api/drizzle/0004_stage_b_channels.sql`: the migration for it.
- `apps/api/src/db/index.ts`: the matching bootstrap DDL.

Nothing in `packages/contract` changed. The frozen schemas (`notifyPayloadSchema`, `channelBindings`, `connectCodes`, `connectCodeSchema`, `CONNECT_CODE_TTL_SEC`) are used as they are.
