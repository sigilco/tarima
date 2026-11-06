# Batch 7: dogfood-ready (docs and config for first real use)

Branch `batch/dogfood-ready`. Read first: `docs/handoff/context/00-master-plan.md`, repo `AGENTS.md`, `.env.example`, `scripts/dev.ts`.

## Deliverables (three, nothing else)
1. **`docs/dogfood.md`:** from fresh clone to first real event: `mise run setup && mise run dev`, dev-login, which env vars are required versus optional (table: var, needed for, default, where to get it; never values), the Berkeley decision-models scenario as a 10-step script, and known limits (no live WhatsApp number, Google tier off by default).
2. **`scripts/doctor.ts` and `mise run doctor`:** reports each env var present or missing (never prints values), Node 24, pnpm, ports free, DB writable, and which providers are live versus replay. Exit nonzero only for blockers. Unit-test the pure checks.
3. **`.env.example` audit:** every env var read anywhere (grep `process.env` and `import.meta.env`) is listed with a comment, or flagged in the report as undocumented. Add a test that fails when code reads a var missing from `.env.example`.

## Acceptance
- `mise run doctor` works on a clean clone with no `.env`, listing blockers. `mise run validate` green.
- Do not change runtime behavior.

## Repo rules (apply to every batch)
- Work only on your own branch (`batch/<name>`). Never push to `main`, never tag or release, never open a PR unless this brief says so.
- Base is `work/integrate-sp` (W0-W4 plus search-providers, CI fixed, 0010_eve_memory and 0011_provider_ledger applied). Do not touch files outside your deliverables.
- Package manager: pnpm only (never npm/npx/pip). Conventional atomic commits. No Co-Authored-By trailers. Never `--no-verify`.
- Never put API keys or secrets in files, fixtures, logs or commits. Tests run offline against recorded fixtures with an injected `fetch`; no live network in tests.
- Migrations: use the next free number at the time you start and name the file for your batch (e.g. `0015_<topic>.sql` or higher); the orchestrator renumbers on merge if two batches collide.
- Gate before reporting: `mise run validate` green, plus `mise run verify:smoke` if you touched the API, web proxy or agent wiring. Stop any server you start; do not leave processes running.
- Commit and push at least every 20 minutes. Do not start anything not on the deliverable list.
- Finish by writing `docs/handoff/<batch>/REPORT.md`: what shipped, gate output lines, deviations, what is left. Report failures honestly.
