# Batch 3: email-outreach (tickets T1 to T7)

Branch `batch/email-outreach`. Read first: `docs/handoff/context/00-master-plan.md` and `tarima-email.md` (the full design: minimal change set table, identity model, inbound path, risks, 10-step dev runbook). `tarima-gtm.md` has the CAN-SPAM lines the compliance ticket refers to.

## Deliverables (three, nothing else)
1. **Dev stack and seam: T1 and T2.** Replace the hand-rolled mail mock with a MailDev 3 wrapper that keeps the same `start()/stop()` contract and a `GET /inbox` shim so existing assertions survive (use `pnpm -C apps/web add -D maildev`); make `MAIL_API_BASE_URL` a real override of the Brevo endpoint in `packages/channels/src/providers/email.ts` and `apps/api/src/mail.ts`. NOTE: the W3 branch may also touch the `MAIL_API_BASE_URL` seam; keep your change minimal and isolated so the merge is trivial, and say so in the report.
2. **Outbound path: T3, T4, T5.** Drain service that sends the staged outbox row via `emailAdapter` when the approval settles (wired to the `interaction.settled` mirror in `apps/web/agent/lib/mirror.ts`), status flips to sent/failed with the provider Message-ID stored; template helper with identity block, postal address and opt-out line, plus a suppression table (new migration) honored before send; Reply-To `rfq+<entityId>@outreach.tarima.events` and Message-ID stored for threading. Tests with the MailDev wrapper.
3. **Inbound and deploy: T6 and T7.** `apps/api/src/routes/webhooks.ts`: persist the parsed reply into `outreach_messages`, decode `rfq+<entityId>` from the to address with fallback to `entities.contactEmail`, bump entity status, emit an event; test with a recorded raw email. T7 is documentation only: the outreach subdomain, Brevo verification and Cloudflare Email Routing steps in `deploy/README.md` and the secrets manifest. Do not touch real DNS or secrets.

## Acceptance
- The approve-to-send-to-reply loop works end to end against MailDev in a test; suppression and opt-out line verified; `mise run validate` and `mise run verify:smoke` green.
- Phone/SMS is out of scope.


## Repo rules (apply to every batch)
- Work only on your own branch (`batch/<name>`). Never push to `main`, never tag or release, never open a PR unless this brief says so.
- Base is `work/w012-dev-validate` (W0 to W2: `mise run validate` and `mise run verify:smoke` exist; read the repo `AGENTS.md` "Definition of done" first). Sibling work (W3 WhatsApp on `work/w3-whatsapp-chatsdk`, W4 memory on `work/w4-eve-memory`) is NOT in your base. Do not edit `apps/web/agent/channels/whatsapp*`, `apps/web/agent/memory*`, or `apps/web/agent/lib/memory*`. In `agent.ts` only register your new tools, nothing else.
- Package manager: pnpm only (never npm/npx/pip). Conventional atomic commits. No Co-Authored-By trailers. Never `--no-verify`.
- Never put API keys or secrets in files, fixtures, logs or commits. Tests run offline against recorded fixtures with an injected `fetch`; no live network in tests.
- Migrations: use the next free number at the time you start and name the file for your batch (e.g. `0011_<topic>.sql`); the orchestrator renumbers on merge if two batches collide.
- Gate before reporting: `mise run validate` green, plus `mise run verify:smoke` if you touched the API, web proxy or agent wiring. Stop any server you start; do not leave processes running.
- Commit and push at least every 20 minutes. Do not start anything not on the deliverable list.
- Finish by writing `docs/handoff/<batch>/REPORT.md`: what shipped, gate output lines, deviations, what is left. Report failures honestly.
