# Batch 9: dev-memory-e2e (from the tarima-verify findings)

Branch `batch/dev-memory-e2e`. Based on `batch/hardening` tip only so the brief set is together; rebase onto `work/integrate-sp` if the orchestrator says so. Read first: repo `AGENTS.md`, `apps/web/agent/agent.ts` (mockModel), `scripts/dev.ts`.

## Deliverables (three, nothing else)
1. **Stub responder that can call tools:** extend the mockModel so a user message like `remember: <fact>` emits a `memory__save_memory` tool call and `what do you remember` triggers recall, deterministic, stub mode only. Add a Playwright test (the repo's `@playwright/test`) with three browser contexts: A saves a fact, A in a NEW session recalls it, B (second dev-login user) does not see it. This is verification check 6 from the master plan.
2. **dev-login 404 window:** `/api/dev/login` returned 404 for about 10 minutes after the first `mise run dev` boot, then recovered with no change. Reproduce by booting cold 5 times, polling the URL printed by `scripts/dev.ts`; make dev.ts print the URL only once the route answers (readiness probe), and record the repro result either way.
3. **dev.ts self-exit:** one boot ended with `[dev] ERROR task failed` after about 90s because a child exited nonzero. Capture which child and why, and make dev.ts report the failing child's name and last 20 log lines.

## Acceptance
- Playwright memory test passes 3 runs in a row; `mise run validate` green.

## Repo rules (apply to every batch)
- Work only on your own branch (`batch/<name>`). Never push to `main`, never tag or release, never open a PR unless this brief says so.
- Base is `work/integrate-sp` (W0-W4 plus search-providers, CI fixed, 0010_eve_memory and 0011_provider_ledger applied). Do not touch files outside your deliverables.
- Package manager: pnpm only (never npm/npx/pip). Conventional atomic commits. No Co-Authored-By trailers. Never `--no-verify`.
- Never put API keys or secrets in files, fixtures, logs or commits. Tests run offline against recorded fixtures with an injected `fetch`; no live network in tests.
- Migrations: use the next free number at the time you start and name the file for your batch (e.g. `0015_<topic>.sql` or higher); the orchestrator renumbers on merge if two batches collide.
- Gate before reporting: `mise run validate` green, plus `mise run verify:smoke` if you touched the API, web proxy or agent wiring. Stop any server you start; do not leave processes running.
- Commit and push at least every 20 minutes. Do not start anything not on the deliverable list.
- Finish by writing `docs/handoff/<batch>/REPORT.md`: what shipped, gate output lines, deviations, what is left. Report failures honestly.
