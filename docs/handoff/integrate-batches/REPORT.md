# Batch 5: integrate-batches — REPORT

Branch `batch/integrate-batches`. Merged the three cloud batches plus the W3
whatsapp cherry-pick onto the base that already had search-core (5c1568a).

## What shipped

Commits on top of `71ad84b` (base + first merge):

- `fe963ea` merge(batch): email-outreach — drain-on-approve outreach sender,
  compliance footer, threading/replies, maildev mock. Conflicts resolved as
  unions: `apps/api/src/mail.ts` (kept the unified `mailEndpoint()` seam,
  see below), `apps/web/agent/lib/mirror.ts` (union of `memoryJournal` +
  `drainOutbox` imports), `pnpm-lock.yaml` regenerated with `pnpm install`,
  drizzle meta renumbered (see Migrations).
- `ce2a97e` merge(batch): agent-tools — `gtm_contacts` table/service,
  observer links + audit feed, `create_entity`/`set_brief` tools, AuditView /
  ObserverShare / ObserverView UI. Conflicts resolved as unions:
  `apps/api/src/db/index.ts` (BOOTSTRAP_DDL keeps memory_*, provider_ledger
  AND gtm_contacts), `apps/api/src/db/schema.ts` (same union), drizzle meta
  renumbered.
- `4035869` cherry-pick of `9723ff2` from `origin/work/w3-whatsapp-chatsdk`
  (fix(web): await async probes in the whatsapp round-trip poll loop). Clean
  pick; it was the only commit on that branch not already in the base
  (`origin/cursor/search-core-00a8` had no commits outside the merged
  search-core).
- `b1bd087` test(api): `src/db/migrations.test.ts` — applies every
  `apps/api/drizzle/*.sql` in order to an empty DB and compares the
  table/column sets against a DB built by `BOOTSTRAP_DDL` (now exported from
  `apps/api/src/db/index.ts`). Passes.

## Migrations

Final chain in `apps/api/drizzle/` + `meta/_journal.json` (idx → tag):

- 0010 `0010_eve_memory`, 0011 `0011_provider_ledger` (pre-existing)
- 0012 `0012_place_geo` (was `0010_place_geo.sql` from search-core, which had
  shipped without journal/snapshot entries — regenerated via
  `drizzle-kit generate` so the snapshot chain is unbroken)
- 0013 `0013_email_outreach` (was `0010_email_outreach.sql`)
- 0014 `0014_gtm_contacts` (was `0010_gtm_contacts.sql`)

Method: for each incoming batch the SQL was staged out of `schema.ts`,
`drizzle-kit generate --name <tag>` run against the union schema to produce
the next-numbered `.sql` + snapshot + journal entry, then the next batch's
tables restored and repeated. Generated SQL is statement-identical to the
batches' originals (verified by diff). Snapshot `prevId` chain verified:
0011→0010→0009 … 0014→0013→0012→0011. Every table/column is mirrored in
BOOTSTRAP_DDL (union kept in both merge conflicts).

## MAIL_API_BASE_URL seam (deliverable 3)

Kept the **email-outreach** implementation, unified into one helper in
`apps/api/src/mail.ts`: `mailEndpoint()` treats `MAIL_API_BASE_URL` as an
origin and appends `/v3/smtp/email`, unless the value already ends in that
path (same rule `packages/channels/src/providers/email.ts` already used).
`sendMail` also sends when only `MAIL_API_BASE_URL` is set (no
`BREVO_API_KEY`), which the mock needs. This is fully compatible with W3's
mock harness: `scripts/dev.ts`/`scripts/smoke.ts` set the var to an origin
(`http://127.0.0.1:3513`) and `maildev-mock.mjs` serves `POST
/v3/smtp/email`. Email-outreach's tests (`outreach-drain.test.ts`) already
drive the seam through `MAIL_API_BASE_URL`.

## Gates

- `mise run validate:quick` after each merge: all steps passed.
- `mise run validate` on the final tip (also run by the pre-push hook):
  `OK turbo(typecheck+lint+test)`, `OK oxfmt`, `OK manifests`, `OK knip` —
  api 177 tests / 29 files, web 62 tests / 14 files, channels 48, contract 40,
  auth-core 43. All green.
- `mise run verify:smoke` on the final tip: `smoke: 7/7 checks passed
  [port 3900, eve 4390]` (web health, landing+asset, dev-login 302, eve
  session 202, session stream 200, chat turn streams, channel mocks up).
  The leftover preview server process was killed afterwards; ports free.
- `mise run eval:offline`: `eval:offline 25/25 passed`.
- `git grep -n '^<<<<<<<'`: empty.

## Deviations / notes

- One `git push` attempt failed on a flake: `web#test` `agent/lib/mirror.test.ts`
  hit `SqliteError: database is locked` at `journal_mode = WAL` — the known
  parallel-vitest shared-DATABASE_URL race the agent-tools busy-timeout commit
  (a304ace) mitigates but does not fully eliminate. `pnpm vitest run` in
  apps/web passed standalone (62/62) and the retry push ran the full validate
  green. Worth a follow-up if it recurs.
- `packages/*/tsconfig.tsbuildinfo` files ride along in merge commits, same
  as previous batches.
- The three incoming migrations' original `.sql` file names were removed and
  replaced by the drizzle-kit-generated renumbered files (contents
  identical); journal tags match filenames.

## Left

- Nothing on the deliverable list. The orchestrator merges
  `batch/integrate-batches` into `work/integrate-sp`; this batch did not
  touch `main` or `work/integrate-sp`.
