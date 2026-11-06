# Batch 2: search-providers (enrichment ladder, Google escalation tier, sponsors)

Branch `batch/search-providers`. Read first: `docs/handoff/context/00-master-plan.md`, `tarima-search-plan.md` (Phases 3 and 4, KPIs), `tarima-gmaps.md` (the Google Places design, quotas, ToS), `tarima-scrape.md` (what may be scraped and what may not), `tarima-scout.md` (sponsors gap). This batch runs in parallel with batch 1 (`batch/search-core`), which owns `venue_catalog` geo columns, `search_cache` and `search_venues`. Write your providers as self-contained modules with injected `fetch` and your own tables; integration into `search_venues` happens at merge. Do not create the geo columns or the cache.

## Deliverables (three, nothing else)
1. **Google Places (New) escalation provider, gated OFF by default.** `apps/api/src/services/providers/googleplaces.ts` following `tarima-gmaps.md` sections 2.5 and 3: tier-gated field masks (a Pro call can never include an Enterprise field), `provider_ledger` table (day in `America/Los_Angeles`), env flags `GOOGLE_PLACES_ENABLED=0`, `GOOGLE_PLACES_FIELD_TIER`, `GOOGLE_PLACES_DAILY_BUDGET`, `GOOGLE_PLACES_ENTERPRISE_DAILY`, `GOOGLE_PLACES_WARM_DAILY=0`, per-method circuit breaker, 429 handling, header-only key (`X-Goog-Api-Key`). Hard rule: persist only `place_id` and provenance; unit-test the no-persist invariant (no Google display field is ever written to the catalog), the refuse-Enterprise path and the 429 path. No live Google calls in tests; write fixtures by hand from the response shapes in the report.
2. **Enrichment ladder: Foursquare (shortlist only) and tier-2 crawl.** `providers/foursquare.ts` and `apps/api/src/services/enrich.ts`: for top-K shortlisted venues lacking contact, crawl the venue site via the cauce `fetch_and_index` MCP (base `CAUCE_BASE_URL`), extract JSON-LD and NAP (tel:, mailto:), respect robots.txt, budget `TARIMA_CRAWL_BUDGET_PER_RUN`, LLM-extraction fallback behind a mock gateway and `TARIMA_LLM_EXTRACT_DAILY_CENTS`. Fixtures: a WordPress JSON-LD page, a bare-HTML tel/mailto page, a robots-disallowed case, an LLM-fallback case. Do NOT build Google Maps or DuckDuckGo scraping; the scrape report recommends against it.
3. **`search_sponsors` and `add_candidate` tools, Phase 4.** `apps/web/agent/tools/search_sponsors.ts` (cauce `/api/search`, ranking, domain dedup) and `add_candidate.ts` (entity write reusing the `createEntity` service so rows match the MCP path; idempotent). Recorded cauce response fixture required.

## Acceptance
- All three behind injected clients with offline fixtures; `mise run validate` green; Google tier provably inert with `GOOGLE_PLACES_ENABLED=0`.
- Write the integration notes the orchestrator needs (which functions `search_venues` should call, in what order) in your REPORT.md.


## Repo rules (apply to every batch)
- Work only on your own branch (`batch/<name>`). Never push to `main`, never tag or release, never open a PR unless this brief says so.
- Base is `work/w012-dev-validate` (W0 to W2: `mise run validate` and `mise run verify:smoke` exist; read the repo `AGENTS.md` "Definition of done" first). Sibling work (W3 WhatsApp on `work/w3-whatsapp-chatsdk`, W4 memory on `work/w4-eve-memory`) is NOT in your base. Do not edit `apps/web/agent/channels/whatsapp*`, `apps/web/agent/memory*`, or `apps/web/agent/lib/memory*`. In `agent.ts` only register your new tools, nothing else.
- Package manager: pnpm only (never npm/npx/pip). Conventional atomic commits. No Co-Authored-By trailers. Never `--no-verify`.
- Never put API keys or secrets in files, fixtures, logs or commits. Tests run offline against recorded fixtures with an injected `fetch`; no live network in tests.
- Migrations: use the next free number at the time you start and name the file for your batch (e.g. `0011_<topic>.sql`); the orchestrator renumbers on merge if two batches collide.
- Gate before reporting: `mise run validate` green, plus `mise run verify:smoke` if you touched the API, web proxy or agent wiring. Stop any server you start; do not leave processes running.
- Commit and push at least every 20 minutes. Do not start anything not on the deliverable list.
- Finish by writing `docs/handoff/<batch>/REPORT.md`: what shipped, gate output lines, deviations, what is left. Report failures honestly.
