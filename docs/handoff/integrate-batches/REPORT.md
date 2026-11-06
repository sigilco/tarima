# Batch 5: integrate-batches — REPORT

Branch `vps/integrate-batches`, pushed to origin at `ebda273`. Time box
2.5h; all three deliverables shipped and all acceptance gates green.

## What shipped

1. **Merges, in the brief's order, one commit per merge:**
   - `origin/batch/search-core`: already up to date (the branch tip
     36b73ce/509da78 was an ancestor of the base via the base's own
     search-core merge). `origin/cursor/search-core-00a8` pointed at the
     same commits; nothing extra to take.
   - `origin/batch/email-outreach`: merge commit `9d53968`.
   - `origin/batch/agent-tools`: merge commit `b173ff0`.
   - Cherry-pick `9723ff2` from `origin/work/w3-whatsapp-chatsdk`:
     commit `2790532`. That was the only commit on the branch not in the
     base.
2. **Migrations renumbered to 0012/0013/0014** (commit `7881a38`):
   - Deleted the three colliding `0010_*.sql` files the batches carried
     (0010_email_outreach, 0010_place_geo, 0010_gtm_contacts) and
     regenerated with `drizzle-kit generate` in three steps so each
     migration only contains its batch's tables:
     `0012_place_geo.sql` (place_cache, provider_budget, provider_circuit,
     venue_catalog/search_cache columns + geo index), `0013_email_outreach.sql`
     (outreach_suppressions), `0014_gtm_contacts.sql` (gtm_contacts).
     `0012_snapshot.json.prevId` = `0011_snapshot.json.id`; the whole
     prevId chain is unbroken (asserted by test).
   - Kept the base branch's 0010/0011 snapshots and journal during the
     conflicts (union-of-tables lived in the chain already; taking an
     incoming 0010 snapshot would have broken prevId).
   - BOOTSTRAP_DDL in `apps/api/src/db/index.ts`: union merged for both
     merges (eve memory + provider_ledger + gtm_contacts), and fixed a
     pre-existing gap the new test caught — `projects.send_approved_at`
     (migration 0005) was missing from the CREATE TABLE line, it was only
     added by `addColumnIfMissing` on databases created before 0003.
     BOOTSTRAP_DDL is now exported.
   - New test `apps/api/src/db/migrations.test.ts`: applies all 15
     migrations to an empty sqlite, compares table and column sets
     against a BOOTSTRAP_DDL-created DB, and asserts the snapshot prevId
     chain plus sql-file/journal parity.
3. **MAIL_API_BASE_URL seam (commit `ebda273`):** kept the
   email-outreach/W3 mock harness contract as the one implementation
   (origin **or** full `/v3/smtp/email` path accepted, trailing slashes
   stripped, override sends even without `BREVO_API_KEY`); the base's
   origin-only `mailApiBaseUrl()` helper was removed from
   `apps/api/src/mail.ts` and replaced with `mailSendEndpoint()`, which
   mirrors `sendEndpoint()` in `packages/channels/src/providers/email.ts`.
   email-outreach's tests (`packages/channels/test/email.test.ts`,
   `apps/web/agent/lib/outreach-drain.test.ts`) already used this
   contract, so no test changes were needed.

## Gate output (final tip ebda273)

```
validate: all steps passed [turbo(typecheck+lint+test)=29762ms, oxfmt=1691ms, manifests=653ms, knip=27405ms]
smoke: 7/7 checks passed [port 3900, eve 4310]
  OK   web health
  OK   landing + asset — /assets/styles-Bwl1Hx63.css
  OK   dev-login — status 302
  OK   eve session via proxy — status 202
  OK   session stream opens — status 200
  OK   chat turn streams — 370 bytes
  OK   channel mocks up — tg 404 wa 404
eval:offline 25/25 passed
git grep -n '^<<<<<<<'  -> empty
```

No server left running by this session (verified with `ss -ltnp`; a
`*:3900` listener that exists belongs to the `vps-hardening` worktree,
not this batch).

## Deviations

- `pnpm-lock.yaml` conflict: took theirs and regenerated implicitly via
  the pre-commit hook's `pnpm install`, as the brief allowed.
- Took the base side for the drizzle meta conflicts (rather than
  hand-merging incoming snapshots) because the base journal/snapshot
  chain already contained the union of tables; the incoming snapshots'
  prevIds pointed at the same parent as base's 0010, so keeping base
  preserved the chain while hand-merging three UUID-keyed snapshots by
  hand had high corruption risk. The renumber-then-regenerate step then
  rebuilds 0012-0014 from the merged schema.ts, which is what actually
  carries the union.
- One pre-existing flake surfaced only under load: `contract-freeze`
  "bootstraps the new tables and projects.stage" times out at 5s when the
  box is heavily loaded (other batches running gates concurrently). It
  passes in isolation every time. Fixed in `9926109` by giving that test
  a 30s timeout with a comment explaining why. Also observed once: an
  `auth.test.ts` timeout under the same load, which has not recurred and
  was left untouched.
- `verify:smoke` needed an explicit `pnpm build` first (smoke does not
  build; the mise task doesn't chain it). No code change.

## What is left

Nothing on the deliverable list. Not done (out of scope per brief): the
orchestrator merges this branch into `work/integrate-sp`/`main`.
