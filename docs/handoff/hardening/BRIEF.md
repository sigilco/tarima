# Batch 6: hardening (smoke cleanup, W3 round-trip flake, flaky gate)

Branch `batch/hardening`. Read first: repo `AGENTS.md`, `scripts/smoke.ts`, the WhatsApp round-trip test in `apps/web` (search `round-trip`).

## Deliverables (three, nothing else)
1. **`scripts/smoke.ts` must always stop what it starts:** on success, failure, SIGINT and SIGTERM, kill the process groups of the API, web and eve children and wait for exit. Add a test or a self-check that starts smoke against a deliberately failing check and asserts no child PIDs remain. (We leaked five orphan node processes before.)
2. **Root-cause the WhatsApp round-trip flake.** Symptom: the agent-reply leg intermittently fails; the eve local-workflow queue's first delivery gets ECONNREFUSED. Reproduce 20 runs in a loop and record the pass rate before and after. Fix the cause (readiness wait on the eve queue before posting, not a longer sleep). Cherry-pick `origin/work/w3-whatsapp-chatsdk` 9723ff2 first if it is not in your base.
3. **Flaky gate:** the pre-push `validate` failed once and passed on retry. Run `mise run validate` 5 times, identify any timing-dependent test, and make it deterministic (fake timers or injected clock). If none flaked, say so and list the run durations.

## Acceptance
- Round-trip passes 20 of 20 after the fix (report before and after numbers). Smoke leak test green. `mise run validate` and `verify:smoke` green.
- Scope guard: no feature code; touch only smoke, the round-trip test harness, and flaky tests.

## Repo rules (apply to every batch)
- Work only on your own branch (`batch/<name>`). Never push to `main`, never tag or release, never open a PR unless this brief says so.
- Base is `work/integrate-sp` (W0-W4 plus search-providers, CI fixed, 0010_eve_memory and 0011_provider_ledger applied). Do not touch files outside your deliverables.
- Package manager: pnpm only (never npm/npx/pip). Conventional atomic commits. No Co-Authored-By trailers. Never `--no-verify`.
- Never put API keys or secrets in files, fixtures, logs or commits. Tests run offline against recorded fixtures with an injected `fetch`; no live network in tests.
- Migrations: use the next free number at the time you start and name the file for your batch (e.g. `0015_<topic>.sql` or higher); the orchestrator renumbers on merge if two batches collide.
- Gate before reporting: `mise run validate` green, plus `mise run verify:smoke` if you touched the API, web proxy or agent wiring. Stop any server you start; do not leave processes running.
- Commit and push at least every 20 minutes. Do not start anything not on the deliverable list.
- Finish by writing `docs/handoff/<batch>/REPORT.md`: what shipped, gate output lines, deviations, what is left. Report failures honestly.
