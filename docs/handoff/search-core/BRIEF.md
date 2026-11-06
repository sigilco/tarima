# Batch 1: search-core (tiered venue discovery, cache, OSM)

Branch `batch/search-core`. Read first: `docs/handoff/context/00-master-plan.md` (overall program), `tarima-search-plan.md` (Phases 1 and 2, section 2 cache design, section 3.2 evals), `tarima-scout.md` (gap analysis), `tarima-scrape.md` (only the parts about Overpass and Geoapify). Recorded fixtures are in `docs/handoff/context/fixtures/{osm,geoapify}` (real Berkeley responses; use them, do not call the network).

## Deliverables (three, nothing else)
1. **`search_venues` agent tool, Phase 1.** `apps/web/agent/tools/search_venues.ts` plus `apps/api/src/services/venue-search.ts`: Photon geocode, Geoapify Places circle search, upsert into `venue_catalog` (add geo columns via migration + BOOTSTRAP_DDL), Tier 0 SQLite `search_cache` (7-day query TTL, 30-day venue TTL, stale-while-revalidate, negative caching), haversine distance, dedup by external_id and by normalized name within 50 m, the honest-contact rule and `contact_source` provenance. Provider clients take an injected `fetch`. Env: `GEOAPIFY_API_KEY` (read from env only; add to `.env.example` with a comment).
2. **Overpass arm and Overture backfill, Phase 2.** `apps/api/src/services/providers/overpass.ts` with retry/backoff/timeout, a daily budget counter (`TARIMA_PLACE_OVERPASS_BUDGET`, default 100) and a circuit breaker; `apps/api/scripts/backfill-overture.ts` (dev-time script, not run in CI). Replay tests use the recorded OSM fixtures, including a 502-to-breaker-open case. Include the small background **cache-warming job** from the plan (seed grid of areas and categories, respects the Overpass budget, off by default behind an env flag).
3. **Offline eval harness.** `evals/place/golden-venues.jsonl` (the 25 Berkeley golden queries from the plan) and an `eval:offline` script (deterministic checks only: radius, schema validity, dedup invariant, contact honesty), wired as a mise task. Include the Berkeley decision-models evening scenario from the master plan as one golden case.

## Acceptance
- With fixtures replayed, "look for venues near UC Berkeley" returns real rows with distance, and a second identical call is a cache hit with zero provider calls.
- `eval:offline` passes with zero fixture edits. `mise run validate` green.
- Out of scope: Google Places, Foursquare, crawling, sponsors search (batch 2).


## Repo rules (apply to every batch)
- Work only on your own branch (`batch/<name>`). Never push to `main`, never tag or release, never open a PR unless this brief says so.
- Base is `work/w012-dev-validate` (W0 to W2: `mise run validate` and `mise run verify:smoke` exist; read the repo `AGENTS.md` "Definition of done" first). Sibling work (W3 WhatsApp on `work/w3-whatsapp-chatsdk`, W4 memory on `work/w4-eve-memory`) is NOT in your base. Do not edit `apps/web/agent/channels/whatsapp*`, `apps/web/agent/memory*`, or `apps/web/agent/lib/memory*`. In `agent.ts` only register your new tools, nothing else.
- Package manager: pnpm only (never npm/npx/pip). Conventional atomic commits. No Co-Authored-By trailers. Never `--no-verify`.
- Never put API keys or secrets in files, fixtures, logs or commits. Tests run offline against recorded fixtures with an injected `fetch`; no live network in tests.
- Migrations: use the next free number at the time you start and name the file for your batch (e.g. `0011_<topic>.sql`); the orchestrator renumbers on merge if two batches collide.
- Gate before reporting: `mise run validate` green, plus `mise run verify:smoke` if you touched the API, web proxy or agent wiring. Stop any server you start; do not leave processes running.
- Commit and push at least every 20 minutes. Do not start anything not on the deliverable list.
- Finish by writing `docs/handoff/<batch>/REPORT.md`: what shipped, gate output lines, deviations, what is left. Report failures honestly.
