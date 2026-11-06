# REPORT — batch/email-outreach (T1–T7)

## What shipped

- **T1+T2 — MailDev dev stack + `MAIL_API_BASE_URL` seam.** `apps/web/tests/mocks/mail-mock.mjs` replaced by `maildev-mock.mjs`: a `MailDev` 3 instance (`maildev` added as `apps/web` devDependency, `smtp:0 web:0`) wrapped in an http server that keeps the old contract — same `start()/stop()`, `sent` array, `server` close event, and `GET /inbox` returning `{count, messages}`. POSTs to `/v3/smtp/email` (the Brevo path) are recorded in `sent`, then injected into real MailDev over a minimal SMTP client so the MailDev UI/MCP show real mails; every other request proxies to the MailDev web app. `MAIL_API_BASE_URL` now overrides the Brevo endpoint in both seams (`packages/channels/src/providers/email.ts` via `sendEndpoint()`, `apps/api/src/mail.ts` inline): trailing slashes stripped, `/v3/smtp/email` appended unless already suffixed, send proceeds with no `BREVO_API_KEY` and no `api-key` header when unset.
- **T3+T4+T5 — drain-on-approve, compliance, threading.** `apps/api/src/services/outreach-mail.ts`: `drainOutbox()` sends staged `agent.email` outbox rows through `outreachEmailAdapter()` (`apps/api/src/channels.ts`, `MAIL_FROM_OUTREACH` → `MAIL_FROM` fallback). On accept: status `sent`, `sentAt`, provider `messageId` + `replyTo` recorded on the payload, outbound row in `outreach_messages`, `outreach.email_sent` event. On refuse/suppress: `failed` + error. `renderOutreachBody` appends identity + postal address (`OUTREACH_POSTAL_ADDRESS`) + opt-out line (`unsubscribe@OUTREACH_REPLY_DOMAIN`); `outreach_suppressions` table (migration `0010_email_outreach.sql` + bootstrap DDL) is consulted before send, `suppressEmail`/`isSuppressed` exported. Reply-To is `rfq+<entityId>@OUTREACH_REPLY_DOMAIN` (default `outreach.tarima.events`); `decodeRfqEntity` accepts `rfq+`/`rfq-`. `send_email` tool gains optional `entityId`; `drainAfterSettledCall` in `apps/web/agent/lib/mirror.ts` drains keyed by the same sha256 idempotency key when a `send_email` `call.settled` completes (wired in `hooks/mirror.ts`; `interaction.settled` fires before tool execution, so the drain hook hangs off `call.settled` — documented in code).
- **T6 — inbound reply persistence.** `apps/api/src/routes/webhooks.ts`: `recordInbound` resolves the entity via the `rfq+` tag on the To header (fallback: `entities.contactEmail` == sender), persists the parsed reply into `outreach_messages` (direction `inbound`, `inReplyTo`/`References`/`messageId`/`threadId` captured), bumps entity status to `parsed`, emits `outreach.reply`. Unmatched replies are still acknowledged without persistence.
- **T7 — deploy docs + manifest.** `deploy/README.md` gains an "Outreach identity" section (outreach subdomain on the Cloudflare zone, Brevo domain verification + SPF/DKIM/DMARC records, verified `MAIL_FROM_OUTREACH` sender, reuse of `apps/inbound-worker` catch-all via a `*@outreach.tarima.events` Email Routing rule). `secrets-manifest.toml`: `MAIL_FROM_OUTREACH` added to the `/email` key set; `OUTREACH_REPLY_DOMAIN` + `OUTREACH_POSTAL_ADDRESS` as non-secret `static` keys. No DNS or secrets touched.

## Gates

- `pnpm validate` (full; what `mise run validate` wraps): `all steps passed [turbo(typecheck+lint+test)=4364ms, oxfmt=88ms, manifests=70ms, knip=4204ms]` — run via the pre-push hook (no `mise` binary on the box).
- `node scripts/smoke.ts` (`mise run verify:smoke`): `smoke: 7/7 checks passed [port 3900, eve 4390]`.
- New tests: `packages/channels/test/email.test.ts` (+3 `MAIL_API_BASE_URL` cases), `apps/api/src/routes/webhooks.test.ts` (+3 inbound persistence cases), `apps/web/agent/lib/outreach-drain.test.ts` (5: end-to-end send vs MailDev, suppression, refusal, rfq round-trip, footer).

## Deviations

- Drain trigger hangs off `call.settled` (outcome `completed`), not `interaction.settled` — the brief names `interaction.settled`, but that event fires before the tool executes, so the row isn't staged yet; `call.settled` is the settle the brief intends. Noted in `lib/mirror.ts`.
- `email.ts` `send` now also converts network-level fetch failures into `accepted:false` instead of throwing — needed so a dead provider marks rows `failed` rather than crashing the drain. `apps/api/src/mail.ts` (transactional path) still throws on refusal, unchanged behaviour.
- First push attempt hit the known flaky `SqliteError: database is locked` on `agent/lib/mirror.test.ts` (cross-fork WAL open); repush passed cleanly. Drain tests scope by idempotency key so they never drain sibling rows in the shared test db.
- The manifest validator (`validate_secrets_manifest.py`) needs Python ≥3.11 (`tomllib`); the box only has 3.10, so it wasn't run. Manifest edits are additive only.

## Merge notes

- `MAIL_API_BASE_URL` seam: kept minimal and identical in both files (`sendEndpoint()` helper + same inline logic in `mail.ts`); W3 touches this same seam — the diff is isolated to a few lines so the merge should be trivial.
- Migration `0010` was the next free number when generated; renumber on merge if another batch took it.

## Left

- Phone/SMS: out of scope per brief.
- `OUTREACH_POSTAL_ADDRESS` static default is a placeholder — must be set before first prod send.
- Suppression is drained-side only; no UI to manage `outreach_suppressions` yet.
