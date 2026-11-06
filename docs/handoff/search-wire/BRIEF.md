# Batch 8: search-wire (DEPENDS on batch 5; do not start until the orchestrator confirms integrate-batches is merged)

Branch `batch/search-wire`. Read first: `docs/handoff/context/tarima-search-plan.md` (Phases 3 to 5), `docs/handoff/search-providers/REPORT.md`, `docs/handoff/search-core/REPORT.md`. The base will be re-pointed by the orchestrator after batch 5 lands.

## Deliverables (three, nothing else)
1. **One pipeline:** `search_venues` runs Tier 0 cache, then Geoapify/Photon, Overpass hedge, then (only if results are thin and the flag allows) the Google Places escalation and Foursquare, with the provider ledger counting every paid call and refusing past budget. Escalation decisions are logged as a reason string in the tool result.
2. **Enrichment path:** shortlisted venues are enriched by the cauce crawl for contact info, writing `contact_source` provenance; LLM extraction fallback behind a flag and a token budget, off by default. Replay tests only.
3. **KPI eval:** extend `eval:offline` with coverage (rows with verified contact / rows), cache hit rate on the second pass, and paid calls per query; print a table, fail under the thresholds in the search plan section 3.2.

## Acceptance
- Berkeley scenario end to end on fixtures: cold run, warm run with zero provider calls, Google tier off yields zero paid calls. `validate`, `verify:smoke` and `eval:offline` green.

## Repo rules (apply to every batch)
- Work only on your own branch (`batch/<name>`). Never push to `main`, never tag or release, never open a PR unless this brief says so.
- Base is `work/integrate-sp` (W0-W4 plus search-providers, CI fixed, 0010_eve_memory and 0011_provider_ledger applied). Do not touch files outside your deliverables.
- Package manager: pnpm only (never npm/npx/pip). Conventional atomic commits. No Co-Authored-By trailers. Never `--no-verify`.
- Never put API keys or secrets in files, fixtures, logs or commits. Tests run offline against recorded fixtures with an injected `fetch`; no live network in tests.
- Migrations: use the next free number at the time you start and name the file for your batch (e.g. `0015_<topic>.sql` or higher); the orchestrator renumbers on merge if two batches collide.
- Gate before reporting: `mise run validate` green, plus `mise run verify:smoke` if you touched the API, web proxy or agent wiring. Stop any server you start; do not leave processes running.
- Commit and push at least every 20 minutes. Do not start anything not on the deliverable list.
- Finish by writing `docs/handoff/<batch>/REPORT.md`: what shipped, gate output lines, deviations, what is left. Report failures honestly.
