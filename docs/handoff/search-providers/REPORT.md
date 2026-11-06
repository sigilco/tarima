# search-providers — report

Branch: `batch/search-providers`. Base: `work/w012-dev-validate`.
Scope per `BRIEF.md`: Google Places escalation provider, Foursquare +
venue-site crawl enrichment, `search_sponsors` / `add_candidate` agent
tools. Self-contained modules with injected clients; no integration
into `search_venues` (that is the orchestrator's merge step).

## Shipped

### D1 — Google Places escalation provider (`eb33cb5`)

- `apps/api/src/services/providers/googleplaces.ts` — gated behind
  `GOOGLE_PLACES_ENABLED=1`; default off/inert. Field masks are
  tier-gated: a Pro-tier call's mask can never contain an Enterprise
  field; Enterprise fields require `GOOGLE_PLACES_FIELD_TIER=enterprise`
  plus `GOOGLE_PLACES_ENTERPRISE_DAILY` headroom in `provider_ledger`.
- `apps/api/src/services/providers/ledger.ts` — shared `provider_ledger`
  helpers (`ledgerGet`/`ledgerAdd`); day bucket is
  `America/Los_Angeles`, not UTC. Budgets: `GOOGLE_PLACES_DAILY_BUDGET`
  (all live calls), `GOOGLE_PLACES_ENTERPRISE_DAILY` (enterprise-mask
  calls), `GOOGLE_PLACES_WARM_DAILY` (cache-warming; 0 = never spends).
- Per-method circuit breaker (text search / details / nearby) with
  HTTP 429 handling; the key travels only in the `X-Goog-Api-Key`
  header — never in URLs, logs, fixtures, or persisted rows.
- Hard persistence rule: provider results carry `place_id` +
  provenance only; Google display fields are returned in the session
  response and are never written to `venue_catalog` (tested).
- `0011_provider_ledger.sql` migration + bootstrap DDL + schema table.
- 15 tests, hand-written offline fixtures matching the report's Google
  response shapes; injected `fetch`, zero live calls.
- `.env.example` documents all `GOOGLE_PLACES_*` / `FSQ_API_KEY` /
  `CAUCE_*` / `TARIMA_*` vars.

### D2 — Foursquare shortlist enrichment + tier-2 crawl (`6cf6443`)

- `apps/api/src/services/providers/foursquare.ts` — Places API details
  for shortlisted venues lacking contact; `FSQ_API_KEY` bearer +
  `X-Places-Api-Version`, daily cap via `provider_ledger`, injected
  fetch. 5 tests.
- `apps/api/src/services/extract/` — contact extraction ladder:
  `jsonld.ts` (schema.org `LocalBusiness`/`Organization` contact points),
  `nap.ts` (`tel:`/`mailto:` links first, then bare patterns),
  `index.ts` orchestrator. 9 tests.
- `apps/api/src/services/enrich.ts` — `enrichVenueContacts(venueId)`:
  Foursquare fields → Cauce `fetch_and_index` (`POST
  {CAUCE_BASE_URL}/api/pages`) for the venue site → robots.txt check
  (most-specific-group-wins) → JSON-LD/NAP extraction → optional LLM
  fallback behind an injected gateway, capped by
  `TARIMA_LLM_EXTRACT_DAILY_CENTS`, `TARIMA_CRAWL_BUDGET_PER_RUN=30`.
  Returns structured skip reasons (`robots_disallowed`, `budget`,
  `fetch_failed`, `no_contact_found`, `llm_budget`). Provenance is
  tracked per written field. 15 tests + HTML/Markdown fixtures.
- Honest-contact rule preserved: contacts are written only from
  provider fields or the venue's own page content; the LLM fallback
  extracts/verifiably selects from fetched content and cannot invent
  an address.

### D3 — Sponsor search + candidate write-back (`ea94787`)

- `apps/api/src/services/sponsor-search.ts` — `GET
  {CAUCE_BASE_URL}/api/search?q=…`, RRF-fused results ranked by score,
  domain-deduped (best score per registrable-ish domain, common
  second-level ccTLDs handled). Recorded fixture
  `fixtures/cauce-search-sponsors.json`. 8 tests.
- `apps/web/agent/tools/search_sponsors.ts` — read-only; added to
  `READ_ONLY_TOOLS` in `approval.ts` so it never prompts.
- `apps/web/agent/tools/add_candidate.ts` — internal board write,
  ungated like `update_task`. Reuses `createEntity` so rows are
  byte-identical to the MCP path; `createEntity` gained an optional
  `goalExtras` bag (additive — wire projection unchanged). Idempotent
  on project+lower(name); ownership-checked. 4 tests.
- Approval policy: `add_candidate` intentionally NOT in
  `READ_ONLY_TOOLS` and not outbound-prefixed — it prompts once per
  call under the default policy, consistent with `update_task`-class
  writes. Documented deviation below.

## Deviations

- `add_candidate` prompts for approval (not read-only-listed). The
  brief says candidate write "should remain ungated unless the tool
  explicitly opts in" — eve's policy prompts for non-read-only tools;
  making it fully silent would require a policy carve-out. Chose the
  safer default; orchestrator can whitelist it at merge if wanted.
- Migration is `0011_provider_ledger.sql` (not `0010`) since three
  other batches already claim `0010`; orchestrator still renumbers on
  merge as needed.

## Integration notes (for the merge with search-core)

Recommended call order inside `search_venues` / a shortlist pass:

1. **Discovery**: search-core providers (Geoapify → Photon →
   Overpass/Overture hedge → `search_cache` SWR).
2. **Shortlist enrichment**: for top-K venues lacking contact, call
   `foursquareVenueDetails` (`providers/foursquare.ts`) first, then
   `enrichVenueContacts` (`enrich.ts`) for the website crawl tier.
   Both take injected fetch/db — pass the app db and default fetch.
3. **Google escalation**: only after 1–2, only for top-K shortlist or
   vibe queries, and only when `GOOGLE_PLACES_ENABLED=1`. Results stay
   session-side; persist at most `place_id` + provenance.
4. **Sponsors**: `searchSponsors(query)` then `add_candidate`-equivalent
   `createEntity` calls for chosen candidates.

All provider modules are self-contained; no `venue_catalog` geo or
cache tables were recreated. W3 WhatsApp / W4 memory untouched.

## Gates

- `mise run validate` — all steps passed
  `[turbo(typecheck+lint+test)=12022ms, oxfmt=205ms, manifests=108ms, knip=11706ms]`
  (api tests: 152 passed).
- `mise run verify:smoke` — 7/7 checks passed [port 3900, eve 4390].
  Required `pnpm --filter web build` before `pnpm --filter @tarima/api
  build` because of the pre-existing turbo race (api copies
  `apps/web/dist` with no dependency edge).
- Focused tests during the loop: extract 9, googleplaces 15,
  foursquare 5, enrich 15, sponsor-search 8, tools 11 — all passing.

## Leftovers

- Google tier is off by default; adoption is an operator decision
  (`GOOGLE_PLACES_ENABLED=1` + key in env).
- `provider_ledger` is shared infra — search-core's cache-warming job
  can reuse `ledgerGet`/`ledgerAdd` for its own caps if desired.
- LLM extraction gateway is a seam only; no concrete gateway client
  ships in this batch.
