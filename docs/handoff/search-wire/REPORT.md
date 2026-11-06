# search-wire — report

Branch: `batch/search-wire`. Base: `work/integrate-sp` tip `6361542`
(search-core + search-providers + email-outreach + agent-tools already
merged). Scope per `BRIEF.md`: wire the existing provider modules into
ONE pipeline inside `search_venues`, add the shortlist enrichment path,
and extend `eval:offline` with the plan §3.2 KPIs. No migrations needed
(`provider_ledger`, `search_cache`, `place_cache`, geo columns all
existed).

## Shipped

### D1 — One pipeline (`c158a5f`, `e2a5720`)

`apps/api/src/services/venue-search.ts` now runs, in order:

1. **Tier 0** — exact `query_hash` cache (unchanged SWR/negative/degraded
   rules). Cache hit returns `escalation: "cache_hit"` and makes zero
   fetches.
2. **Tier 1** — Photon geocode (Geoapify hedge) → Geoapify Places →
   Overpass hedge when Geoapify returns < 5 hits (unchanged).
3. **Paid escalation** — only when tier-1 hits < 5
   (`ESCALATE_MIN_HITS`):
   - `googleplaces.searchText` at the configured field-tier ceiling.
     Gated by `GOOGLE_PLACES_ENABLED` inside the provider; every live
     call is counted in `provider_ledger` (`google-places/live`) and
     refused past `GOOGLE_PLACES_DAILY_BUDGET`. Results are
     **session-only**: returned on the response as `googlePlaces`
     (new additive contract field) and never persisted — verified by
     test (no catalog row for the Google fixture venue).
   - `foursquare.searchPlaces` (new function in
     `providers/foursquare.ts`, `GET /places/search`, ledger bucket
     `search`). FSQ hits are licensed POI data: they persist through
     the normal `upsertHits` path with `provider="foursquare"`,
     `external_id="fsq:<fsq_place_id>"`, `contact_source="fsq"`.
   - The decision is logged as a reason string in the tool result
     (`escalation`, additive contract field), e.g.
     `thin_results(0<5) google_text=ok:1 fsq_search=ok:1` or
     `sufficient(hits=20>=5)`.
4. **Tier 2/3 enrichment** — top-K (`TARIMA_PLACE_ENRICH_TOP_K`,
   default 5, 0 disables) shortlist rows lacking contact that are
   actually enrichable (have a website or an `fsq:` external id),
   nearest first: FSQ `placeDetails` for `fsq:`-keyed rows, then
   `enrichVenueContacts` (robots-checked cauce `fetch_and_index` →
   JSON-LD/NAP extraction). Response gains `enriched` count.

Contract (`e2a5720`, additive post-freeze): `CONTACT_SOURCES` gains
`llm_verified`; `venueSearchResponseSchema` gains optional `escalation`,
`googlePlaces` (session-only shape), `enriched`.

### D2 — Enrichment path (`e2a5720`)

- `enrichVenueContact` now **writes `contact_source`** on the catalog
  row (it previously only filled the contact columns). Single-column
  provenance records the email's source when an email was written,
  else the phone's when the phone is the only contact; extract-level
  sources map onto the contract enum (`mailto`/`tel`/`page_text` →
  `page_text`, `jsonld` → `jsonld`, `llm_verified` → `llm_verified`).
- **LLM fallback is now off by default**: `defaultLlmExtractor` only
  runs when `TARIMA_LLM_EXTRACT_ENABLED=1` (new env, documented in
  `.env.example`); explicit `llmExtract` injection still works for
  tests. Spend stays capped by `TARIMA_LLM_EXTRACT_DAILY_CENTS`
  (provider_ledger `llm-extract/cents`, 5¢/call) — the plan's "$1/day"
  budget; "token budget" interpreted as this spend cap.
- FSQ `search` and `details` now share ONE daily cap
  (`FSQ_PLACES_DAILY_BUDGET`): the check sums both ledger buckets so
  the two arms cannot double-spend the 500/mo Pro budget.
- `place-fixtures.ts` `fixtureFetch` now also replays: any host's
  `/robots.txt` (allow-all default), cauce `POST /api/pages`
  (markdown fixture), Google Places and both FSQ endpoints — all
  offline, unknown URLs still throw.

### D3 — KPI eval (`2e42bb4`)

`apps/api/scripts/eval-offline.ts` now runs every golden query twice
(cold miss + identical warm pass) and prints a KPI table:

```
KPI                                   value   threshold  gate
cache_hit_rate_2nd_pass                1.000   >= 0.4     ok   (plan §3.2)
coverage_verified_contact              0.300   >= 0.3     ok
phone_rate                             0.300   info
website_rate                           0.250   info
paid_calls_per_query                   0.000   info
est_cost_usd_per_query                 0.0000  <= 0.002   ok   (plan §3.2)
```

Paid calls are counted from the fixture call log against
`places.googleapis.com` ($32/1k) and `places-api.foursquare.com`
($15/1k); Geoapify/Photon/Overpass/cauce are free-tier or self-hosted.
The eval runs with `env: {}` — Google tier off, no FSQ key — which is
exactly the "zero paid calls" acceptance scenario. Coverage threshold
0.30 was set from the measured fixture floor (5 of 20 Berkeley venues
publish a website; the crawl lifts 6/20 rows to a verified contact).

## Acceptance evidence

`apps/api/src/services/venue-search-wire.test.ts` (5 tests, all
fixture-replay, zero network):

- cold run `cache=miss` with provider calls and `escalation` reason;
  identical warm run `cache=hit`, `escalation="cache_hit"`, **zero**
  fetch calls.
- Google tier off (`env: {}`): zero paid-provider calls on both passes.
- Thin results (empty Geoapify + Overpass fixtures) with
  `GOOGLE_PLACES_ENABLED=1` + `FSQ_API_KEY`: escalation fires, Google
  results returned session-side only (no catalog row — ToS), FSQ row
  persisted, `provider_ledger` shows 1 google live + 1 fsq search +
  1 fsq details call.
- Sufficient results with keys set: no escalation, zero paid calls.
- Enrichment writes `contact_source="page_text"` on row and response;
  LLM fallback off by default (no `llm-extract` ledger rows).

## Gates

```
validate: all steps passed [turbo(typecheck+lint+test)=5087ms, oxfmt=213ms, manifests=112ms, knip=4759ms]
eval:offline 25/25 passed, kpi 3/3 gated
smoke: 7/7 checks passed [port 3900, eve 4390]
```

Smoke required `pnpm --filter web build` then `pnpm --filter @tarima/api
build` first (same turbo race noted by search-providers). No servers
left running by this batch.

## Deviations

- **FSQ needed a search arm.** The merged `foursquare.ts` only had
  `placeDetails` (needs an `fsq_place_id` we never had). Deliverable 1
  names Foursquare in the escalation tier, so I added `searchPlaces`
  (`GET /places/search`) reusing the same auth/ledger pattern —
  ~60 lines, no new dependencies. Flagged here since it is provider
  code, not pure wiring.
- **`contact_source` is single-valued.** A venue whose email comes
  from the crawl and phone from FSQ/OSM can only record one
  provenance; the rule (email's source wins, else phone's when it is
  the only contact) is documented in `enrich.ts`. Per-field provenance
  would need a schema change — left for the orchestrator.
- **Enrich shortlist prefers enrichable rows.** Top-K is nearest-first
  among rows that can actually be enriched (website or `fsq:` id);
  rows with neither are skipped rather than wasting crawl budget.
- **Escalation threshold** `ESCALATE_MIN_HITS = 5` (plan's "merged
  results < 5" hedge rule applied to the paid tier); not env-tunable.
- **`llm_verified` added to `CONTACT_SOURCES`** (additive) so
  tier-3-written contacts keep honest audit provenance instead of
  collapsing to `page_text`.
- Coverage KPI sits exactly at its 0.30 floor — it is fixture-bound
  (only 5/20 golden venues publish websites); real coverage should be
  re-measured at the phase-3 KPI review with live providers.

## Left for later / orchestrator

- Google tier stays off by default; adoption is an operator decision
  (`GOOGLE_PLACES_ENABLED=1` + `GOOGLE_MAPS_API_KEY`).
- `eval:live` monthly drift replay (plan §3.2) not built — out of the
  three deliverables.
- Per-field SWR refreshers, sqlite-vec semantic cache, self-hosted
  Overpass remain Phase-5 deferrals.
- `cache-warm` now also runs the enrich pass (budget-capped); pass
  `enrichTopK: 0` via deps if warming should skip crawls.
