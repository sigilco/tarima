# Batch agent-tools — report

Branch `batch/agent-tools`, base `work/w012-dev-validate` (W0–W2 tip).

## What shipped

### 1. Agent tools: `create_entity` + `set_brief`

- `apps/web/agent/tools/create_entity.ts` — stages a candidate venue or
  sponsor onto the project board through the same `createEntity`
  service the REST/MCP path uses, so rows are identical to MCP-created
  ones. Defaults to the `candidate` (curated shortlist) status; accepts
  wire `ChaseRowState`, channel and missing list. Ownership enforced
  against the session principal (`not_found` for other users' projects).
- `apps/web/agent/tools/set_brief.ts` — persists the structured event
  brief into `projects.goal.brief`, validated against the contract
  `briefSchema`, merged into the existing goal record (other keys
  preserved). `get_project_context` already reads it back.
- `apps/web/agent/instructions.md` — ground rules now tell the agent to
  persist the brief with `set_brief` and stage candidates with
  `create_entity`, and never claim outreach happened.
- Tests: `create_entity.test.ts` (4), `set_brief.test.ts` (4) in the
  `send_email.test.ts` temp-DB style.

### 2. Audit tab v1 + two fixes

- `GET /api/ui/audit` (`apps/api/src/services/audit.ts` +
  `api-handlers/ui.ts`) — the caller's mirrored approval decisions and
  agent session facts, newest first, scoped by `principal_id`.
- `/app/audit` route + `AuditView` component + `fetchAuditFn`; the
  sidebar Audit chip is live (`WorkspaceShell`/`Sidebar` take an
  `active` prop; Projects stays default).
- Component test `AuditView.test.ts` renders seeded data via
  `renderToStaticMarkup` (node env, no DOM).
- Dead `/app/p/$projectId` link removed from `ProjectView`; the
  `workspace.projectEmpty` copy no longer points at the old board.
- Observer link revived: `apps/api/src/services/observer-links.ts`
  (port of the SP7-deleted `room-share.ts` onto the surviving
  `room_share_links` table), owner endpoints
  `GET/POST/DELETE /api/ui/projects/:id/observer-link`, public
  `GET /api/observer/:id?share_token=`, `ObserverShare` control on the
  project view (mint-on-click is idempotent, copies the URL, shows
  expiry, revokes), and the public read-only page `/app/o/$projectId`.
  Service tests cover mint/idempotency/scoping/revoke/expiry/views/PII
  masking (6 tests).

### 3. `gtm_contacts`

- Contract-first: `packages/contract/src/gtm.ts` (`gtmContactSchema`,
  `upsertGtmContactSchema`, `setGtmConsentSchema`,
  `setGtmDoNotContactSchema`) — consent, do-not-contact + reason,
  source, optional project, notes, ISO timestamps.
- Drizzle table `gtm_contacts` + migration `0010_gtm_contacts.sql`
  (next free number at start; sibling batches may collide — renumber on
  merge) + `BOOTSTRAP_DDL` entry.
- `apps/api/src/services/gtm-contacts.ts` — upsert by lower-cased email,
  consent setter, do-not-contact setter (never cleared by upsert),
  `isGtmSuppressed`. Tests: 5.
- No UI, no outbound sending, per the brief.

## Gate output

```
validate:quick — all steps passed [turbo(typecheck+lint)=10521ms, oxfmt=130ms, manifests=129ms]
validate      — all steps passed [turbo(typecheck+lint+test)=19134ms, oxfmt=136ms, manifests=123ms, knip=18870ms]
verify:smoke  — smoke: 7/7 checks passed [port 3900, eve 4390]
```

New tests all ran green: create_entity 4, set_brief 4, AuditView 3,
observer-links 6, audit 2, gtm-contacts 5.

## Deviations

- **`agent.ts` untouched.** eve auto-discovers `agent/tools/*.ts` by
  path (verified in `packages/eve/docs/reference/agent-files.md`); there
  is no tools registry to update. The approval policy needed no change:
  `create_entity`/`set_brief` are internal writes and stay ungated like
  `update_task` (scout step 3).
- **Observer link targets the project view, not a room.** SP7 removed
  the negotiation room, so `resolveRoomResponseSchema`'s room payload
  stays dormant; the live surface is the additive
  `observerViewResponseSchema` (project + entities + access) at
  `/app/o/:projectId`. `roomObserverUrl` remains exported for the frozen
  contract but nothing mints those URLs anymore.
- **ObserverShare fetches on click only** (no mount fetch): POST is
  idempotent, so first click returns the live link if one exists.
- **`turbo run build` races** `@tarima/api#build` against `web#build`
  (api copies `apps/web/dist`, turbo.json has no dependency edge). Hit
  it locally; built `--filter=web` first, then the rest. Pre-existing on
  the base, not introduced here — flagging for W-bookkeeping.
- **Pre-push flake fixed, not retried around.** Two pushes failed in
  `web#test` with `SqliteError: database is locked`: parallel vitest
  workers share one `DATABASE_URL` temp file and raced
  `journal_mode = WAL` + bootstrap DDL at import. Added
  `busy_timeout = 5000` on the shared sqlite open
  (`apps/api/src/db/index.ts`); three consecutive local `vitest run`
  passes and the pre-push gate then went green. This is the same class
  of flake that failed `search-core`'s first push.
- `verify:smoke` requires a prior build (`apps/web/dist`); ran
  `turbo run build --filter=web` then `turbo run build build:eve` first.

## Left / notes for merge

- Migration `0010_gtm_contacts.sql` — renumber if a sibling took 0010.
- `send_email` still only stages; the drain-on-approve sender is the
  email-outreach batch's ticket, not this one.
- `gtm_contacts` has no callers yet — the suppression check
  (`isGtmSuppressed`) is ready for the outbound path to adopt.
- Telegram inline buttons, PostHog, Tally, Cal.com: out of scope per
  brief.
