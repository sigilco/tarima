# Batch 4: agent-tools (GTM and agent-core follow-ups)

Branch `batch/agent-tools`. Read first: `docs/handoff/context/00-master-plan.md`, `tarima-gtm.md` (the ticket table at the end, and the compliance notes), and `tarima-scout.md` section 3 step 3 (candidate intake). Sibling batches: email-outreach owns the outbound template footer and suppression list, so do not build those; search-providers owns `add_candidate`, so do not build it.

## Deliverables (three, nothing else)
1. **`create_entity` and `set_brief` agent tools** plus the agent instructions update, under `apps/web/agent/tools/` and `apps/web/agent/instructions.md` (match existing tool patterns and the `send_email.test.ts` temp-DB test style). Rows must match what the MCP/service path creates.
2. **Audit tab v1 and two small fixes.** Read-only audit tab over `agent_events` and `approvals` in the web app (follow the existing app patterns and the design tokens already in the repo); fix the dead `/app/p/$projectId` link in ProjectView; revive the observer link in the new workspace using the surviving contract and table.
3. **`gtm_contacts` schema.** Contract-first: schema in `packages/contract` (consent, do-not-contact, source, timestamps), drizzle table and migration, a small service with tests. No UI, no outbound sending.

## Acceptance
- Tools have unit tests; the audit tab renders with seeded data in a component or smoke test; `mise run validate` and `mise run verify:smoke` green.
- Telegram inline buttons, PostHog, Tally and Cal.com instrumentation are out of scope.


## Repo rules (apply to every batch)
- Work only on your own branch (`batch/<name>`). Never push to `main`, never tag or release, never open a PR unless this brief says so.
- Base is `work/w012-dev-validate` (W0 to W2: `mise run validate` and `mise run verify:smoke` exist; read the repo `AGENTS.md` "Definition of done" first). Sibling work (W3 WhatsApp on `work/w3-whatsapp-chatsdk`, W4 memory on `work/w4-eve-memory`) is NOT in your base. Do not edit `apps/web/agent/channels/whatsapp*`, `apps/web/agent/memory*`, or `apps/web/agent/lib/memory*`. In `agent.ts` only register your new tools, nothing else.
- Package manager: pnpm only (never npm/npx/pip). Conventional atomic commits. No Co-Authored-By trailers. Never `--no-verify`.
- Never put API keys or secrets in files, fixtures, logs or commits. Tests run offline against recorded fixtures with an injected `fetch`; no live network in tests.
- Migrations: use the next free number at the time you start and name the file for your batch (e.g. `0011_<topic>.sql`); the orchestrator renumbers on merge if two batches collide.
- Gate before reporting: `mise run validate` green, plus `mise run verify:smoke` if you touched the API, web proxy or agent wiring. Stop any server you start; do not leave processes running.
- Commit and push at least every 20 minutes. Do not start anything not on the deliverable list.
- Finish by writing `docs/handoff/<batch>/REPORT.md`: what shipped, gate output lines, deviations, what is left. Report failures honestly.
