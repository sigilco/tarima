# Batch 5: integrate-batches (merge the three cloud batches, one line)

Branch `batch/integrate-batches`. Read first: `docs/handoff/context/00-master-plan.md`, repo `AGENTS.md` (Definition of done).

## Deliverables (three, nothing else)
1. **Merge in this order, one commit per merge, gate after each:** `origin/batch/search-core` (also take any extra commits on `origin/cursor/search-core-00a8`), then `origin/batch/email-outreach`, then `origin/batch/agent-tools`, then cherry-pick `origin/work/w3-whatsapp-chatsdk` commit 9723ff2 (and anything newer on that branch not in your base). Known conflicts from a dry run: search-core: `.env.example`, `apps/web/agent/approval.ts`; email-outreach: `drizzle/meta/0010_snapshot.json`, `_journal.json`, `apps/api/src/mail.ts`, `apps/web/agent/lib/mirror.ts`, `pnpm-lock.yaml`; agent-tools: `0010_snapshot.json`, `_journal.json`, `apps/api/src/db/index.ts`, `apps/api/src/db/schema.ts`. Keep both sides in each (union of approvals, env keys, tables, BOOTSTRAP_DDL). For `pnpm-lock.yaml` regenerate with `pnpm install`, never hand-merge.
2. **Migrations:** base has 0010_eve_memory and 0011_provider_ledger. Renumber the incoming ones to 0012_place_geo, 0013_email_outreach, 0014_gtm_contacts using `drizzle-kit generate` so the `_journal.json` and snapshot `prevId` chain is unbroken (each snapshot's prevId is the previous snapshot's id). Mirror every table and column into BOOTSTRAP_DDL in `apps/api/src/db/index.ts`. Add one test that applies all migrations to an empty DB and to a DB created by BOOTSTRAP_DDL and compares table and column sets.
3. **`MAIL_API_BASE_URL` seam:** email-outreach and W3 both touch it. Keep one implementation (the one W3's mock harness uses), make email-outreach's tests use it, and say which you kept in the report.

## Acceptance
- `mise run validate` and `mise run verify:smoke` green on the final tip, and `mise run eval:offline` 25/25.
- No leftover conflict markers (`git grep -n '^<<<<<<<'` empty). Smoke has 7 or more checks passing and no server left running.
- Push after each merge so the orchestrator can watch. Do NOT merge into `work/integrate-sp` or `main`; the orchestrator does that.

## Repo rules (apply to every batch)
- Work only on your own branch (`batch/<name>`). Never push to `main`, never tag or release, never open a PR unless this brief says so.
- Base is `work/integrate-sp` (W0-W4 plus search-providers, CI fixed, 0010_eve_memory and 0011_provider_ledger applied). Do not touch files outside your deliverables.
- Package manager: pnpm only (never npm/npx/pip). Conventional atomic commits. No Co-Authored-By trailers. Never `--no-verify`.
- Never put API keys or secrets in files, fixtures, logs or commits. Tests run offline against recorded fixtures with an injected `fetch`; no live network in tests.
- Migrations: use the next free number at the time you start and name the file for your batch (e.g. `0015_<topic>.sql` or higher); the orchestrator renumbers on merge if two batches collide.
- Gate before reporting: `mise run validate` green, plus `mise run verify:smoke` if you touched the API, web proxy or agent wiring. Stop any server you start; do not leave processes running.
- Commit and push at least every 20 minutes. Do not start anything not on the deliverable list.
- Finish by writing `docs/handoff/<batch>/REPORT.md`: what shipped, gate output lines, deviations, what is left. Report failures honestly.
