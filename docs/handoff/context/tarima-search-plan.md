# Tarima discovery layer: tiered venue + sponsor search - research and plan

Date: 2026-11-05 (session started 13:44 PST). Author: Maki (research/plan session, read-only on the repo).
Worktree: `~/.worktrees/tarima/scout-assess`, detached at `origin/work/w012-dev-validate` (HEAD `7d47e7b`, 2026-11-05).
Inputs: `/tmp/tarima-scout.md` (baseline assessment), `/tmp/tarima-maps-place-search.md` (treated as unverified chat transcript - every number re-checked below), cauce `~/Documents/prjcts/_own/cauce` (v0.9.2, live at search.localhost:4479), brioso `~/Documents/prjcts/_own/brioso`.
Live test: 15-request OSM budget, raw responses in `/tmp/tarima-osm-test/`.

Vendor numbers below were re-verified at source pages on 2026-11-05 (cited inline). Anything I could not verify at a primary page is marked **[unverified]** and is not load-bearing.

---

# Deliverable 1 - Provider and tier architecture

## 1.1 What tarima needs (per the baseline)

Six primitives, none of which exist today on `w012-dev-validate`: (1) geocode an anchor, (2) category+radius place search, (3) place metadata (hours, phone, email, website, rating, capacity), (4) sponsor/company discovery (text web search, not geo), (5) contact extraction (email/phone from a company's own site), (6) caching so repeats are free. The agent tools today are two SQL LIKE reads (`apps/web/agent/tools/list_venues.ts:16-21`, `list_sponsors.ts:26-33`); `venue_catalog` has no geo/provider/hours columns; `search_cache` has zero readers; the deleted Photon+Overpass chain survives only in git (`c97e7a3^:packages/venuesearch/*`, `255ad59^:apps/api/src/services/venue-search.ts`).

## 1.2 Candidate sources - verified facts

| Source | Verified free tier (2026-11-05) | Caching/storage of results | Attribution / license | Quality for venues & sponsors | Fit verdict |
|---|---|---|---|---|---|
| **Google Places API (New)** - Text/Nearby Search Pro SKU | 5,000 free billable events/mo, then $32/1k (price list, developers.google.com/maps/billing-and-pricing/pricing, "Last updated 2026-11-03"); Places Details 5,000 free then $17/1k; Contact Data SKU $3/1k after 1,000 free | **No caching beyond exceptions**: place_id may be stored indefinitely; lat/lng cacheable max 30 consecutive days; everything else (name, address, phone, rating, website) must not be pre-fetched/cached/stored (Policies for Places API, developers.google.com/maps/documentation/places/web-service/policies; Maps Service Specific Terms §3.2.3 "No Scraping"/"No Caching", §14.3) | Google logo + attribution required even off-map | Best-in-class: ratings, hours, phone, website, popularity. Highest-quality place metadata for venues | Tier-1 **escalation**, not default: caching ban collides with the owner's #1 requirement. Use live-call-only, store only place_id + our own derived notes, or skip. Decision needed from owner |
| **Geoapify Places API** | Free: 3,000 credits/day (~90k/mo), ≤5 req/s, no card; commercial use explicitly allowed in production with attribution (geoapify.com/pricing, FAQ) | **"You are allowed to cache, store, and redistribute the results… without any additional limits or restrictions"** (geoapify.com/places-api FAQ) | Attribution required: OSM (ODbL) + Geoapify link on free plan | OSM-backed POI search with categories + circle filter; metadata ≈ OSM quality (hours/phone where OSM has them) | **Tier-1 default for place search.** Cached-and-storable - uniquely clean terms. Cheap, no card |
| **Radar** | **No free tier**: all plans annual/quote-based (radar.com/pricing FAQ: "Radar does not currently offer a free tier"); historical 100k/mo developer plan no longer advertised | Not verified (paid contract) | Paid contract | Places Search is a Premium Maps endpoint "Starting at $2.00 per 1,000 API calls" (radar.com/pricing) | **Deprioritize.** The transcript's "100,000 requests/month free" is stale; sales-led. Revisit only at scale |
| **Foursquare Places API** | New Places API: first 500 Pro calls/mo $0, then $15 CPM (foursquare.com/pricing Places API table; docs.foursquare.com/developer/reference/upcoming-changes: "Beginning June 1, 2026… 500 free Pro calls"); Premium endpoints (tips/photos) separately priced; **legacy v3 endpoints deprecated 2026-05-15** | Studio/POI data terms are per-product; Places API output is licensed data - do not redistribute raw; internal caching of search results for our own product is normal but not explicitly blessed **[unverified - check dev console terms at signup]** | Foursquare attribution per docs | Rich venue data: hours, phone, website, ratings-adjacent (tips/photos are Premium), categories, chains. Best non-Google metadata source | **Tier-1 escalation for metadata** (place details on shortlisted venues only, ~500 free calls/mo fits a shortlist workflow) |
| **FSQ OS Places (open dataset)** | Free download, Apache-2.0 with NOTICE attribution; 100M+ POIs, 1000+ categories, monthly refresh (opensource.foursquare.com/os-places; places-notice-txt) | Store freely (Apache-2.0 data, NOTICE preserved) | NOTICE.txt attribution | Same lineage as paid FSQ places (the new Places API "powered by FSQ OS Places") | **Tier-1.5 bulk option** - see Overture row; ingest is the same pipeline |
| **LocationIQ** | Free: $25 value, 5,000 req/day, 2 req/s, geocoding/routing/maps, "Limited Commercial Use" with mandatory prominent link-back (locationiq.com/pricing) | Not explicit on page **[unverified]**; underlying OSM data is ODbL | Link-back required on free plan | Geocoding only for our purposes; POI search weak | Skip. Photon (keyless) or Geoapify geocoding cover the anchor-geocode need |
| **Overpass (public, overpass-api.de)** | Keyless. Usage policy: <10,000 queries/day one-off, but **regular app use should be <100 queries/day and <10 MB/day**, divide-by-100 rule for apps; commercial use "should use self-hosted or paid Overpass servers"; custom UA required; 429/406 → pause 30s; "nowadays this server is overloaded - do not expect high reliability" (wiki.openstreetmap.org/wiki/Overpass_API, checked 2026-11-05) | OSM data is ODbL - store derived data freely with attribution | © OpenStreetMap contributors (ODbL) | Full OSM tag richness incl. opening_hours/phone/website; server was **at capacity 3/12 times during our live test today** (502s) | **Tier-1 enrichment only**, behind cache + breaker, honoring the 100/day rule; regional self-host is the tier-2 answer at volume |
| **Overpass (self-hosted regional extract)** | Free software; country/metro extracts from Geofabrik; a Bay-Area-sized extract is far below planet requirements (planet ≈ 500 GB NVMe / 32 GB RAM per prior scout notes; regional is an order of magnitude less) | Own DB, store freely | ODbL attribution | Same tag data, no rate limits | **Phase-later.** Only if OSM becomes the primary provider and >100 queries/day is needed |
| **Overture Maps (places theme)** | Free, monthly releases; latest 2026-10-21.0: 88.4M places (docs.overturemaps.org/blog/2026/10/21/release-notes/); queryable from S3 with DuckDB over bbox, no infra (docs.overturemaps.org/getting-data/duckdb/) | **Store freely.** Places theme is CDLA-Permissive-2.0 from Meta/Microsoft/Foursquare/BrightQuery etc. (docs.overturemaps.org/attribution/) | Per-source attribution; OSM-derived portions carry ODbL notice | Schema (v2.0.0, docs.overturemaps.org/schema/reference/places/place/): names, addresses, websites, socials, **emails, phones, brand, categories, confidence, operating_status** - but **no opening_hours** (hours are a planned schema *extension*, per schema-v2 blog 2026-09-16); richer contact coverage than raw OSM (Meta/Bing merge) | **Tier-1.5 bulk backfill**: one DuckDB query per metro → local SQLite. Zero per-call cost, best phone/website/email coverage of any open dataset |
| **Photon (photon.komoot.io)** | Keyless, "be fair - extensive usage will be throttled"; community norm ≈1 req/s; no availability guarantee (photon.komoot.io Terms of Use; github komoot/photon) | ODbL - store freely | OSM attribution | Geocoding + light POI search (osm_tag filter); weaker address precision than Nominatim; global POI search is not its strength | **Tier-1 default geocoder** (anchor → lat/lng), keyless, already has a deleted-but-recorded adapter with fixtures to restore |
| **Nominatim (public)** | 1 req/s max, no bulk, no auto-generated app usage as a service; policy explicitly forbids embedding as a generic place-search backend (operations.osmfoundation.org/policies/nominatim/) | ODbL | OSM attribution | Best forward/reverse geocoder quality | Geocode-only at ≤1 req/s with caching, or skip in favor of Photon/Geoapify. **Never** as the agent's place-search backend |
| **Cauce text engines (Brave/Bing/DuckDuckGo via declarative engines; Exa via MCP)** | Brave Search API (2026 plans, brave.com/blog/most-powerful-search-api-for-ai, 2026-02-12): every plan gets **$5 free credit/mo** ($20 across plans) with required attribution, Search plan $5/1k requests (~1,000 free queries/mo); an older guide cited "2,000 free queries/mo" (updated 2025-10) **[plan shape changed mid-2026: use the $5-credit framing]**; Exa: $10 free credits/mo + $10 onboarding, Lite $4/1k, Auto $7/1k, +$1/1k per extra result, email/phone enrichment add-ons (exa.ai/pricing, checked today); Tavily 1,000 credits/mo free then ~$8/1k (docs.tavily.com); DDG: no API - HTML scraping only, ToS requires authorized use (duckduckgo.com/terms) | SERP snippets: short factual titles/URLs - low risk to cache; provider-specific storage rights vary (Brave paid plans sell "rights to store data" explicitly) | Per-engine | Sponsors/companies are a **text** problem: "AI companies that sponsor Berkeley meetups" is web search, not POI search. Cauce already fans out bing+brave tier-1, ddgs tier-2 hedge, RRF-fused | **Tier-1 for sponsors**: call local cauce (`/api/search`), get fused SERP, then tier-2 crawl the official domains |
| **Google Maps / Google Search scraping** | See the scraping tier (§1.3) - recommendation is **do not** | n/a | n/a | Best data, worst terms | **Not recommended** |

## 1.3 The scraping / crawling tier (tier 2) - what to extract, from where

Purpose: fill metadata that tier-1 open data lacks, **from the venue's own website** (the most defensible target), not from third-party walled gardens.

**From a venue's own site (high value, low risk):**
- `application/ld+json` → schema.org `LocalBusiness`/`Restaurant`/`EventVenue` JSON-LD: `name`, `telephone`, `email`, `address`, `openingHoursSpecification`, `priceRange`, `acceptsReservations`, `maximumAttendeeCapacity`. This is *published by the business for machines* - the cleanest possible source.
- Microdata/RDFa mirrors of the same (rarer; handle if present).
- OpenGraph/Twitter meta (name, description, image) - weak but free.
- Contact/About pages: `mailto:` and `tel:` links, plain-text phone regex, address blocks.
- Footer NAP (name/address/phone) + hours tables ("Mon–Fri 11–10" heuristics).
- Menu/private-events pages for capacity hints ("seats 80", "up to 120 guests") - regex over text, flagged `source=page_text`.

**From SERP results (cauce, tier-1 text):** result title/URL/snippet give the official domain and often phone snippets; snippets are treated as *pointers*, never as contact facts - the contact must be confirmed on the destination page (honest-contact rule).

**From Google Maps / Google Search result pages - honest assessment (recommendation: NO):**
- **ToS/legal:** Google Maps Platform ToS §3.2.3 (verified quote via N.D.Cal. filing and current terms): "No Scraping… Customer will not export, extract, or otherwise scrape Google Maps Content… (iii) copy and save business names, addresses, or user reviews"; "(b) No Caching… except as expressly permitted." That is the contract if you touch any Google property with a key. For unauthenticated scraping, Google's robots.txt disallows `/maps` for generic bots, and Google has litigated scraping (Seyfarth summary of hiQ line; Meta v. Bright Data, N.D. Cal. 2024 - public-data scraping survived CFAA/contract analysis for logged-out public pages; RyanAir v. Booking, D. Del. Aug 2024 - circumventing anti-bot measures supported misalignment claims; Lovly v. Fox, 11th Cir. 2024 - remanded on scrape-authorization questions). Net: a cloud of contract/CFAA/unfair-competition theories that a small commercial product should not volunteer for, especially when compliant alternatives exist at $0.
- **Technical risk:** Maps is one of the hardest anti-bot targets on the web (consent walls, JS challenges, IP reputation, layout churn). Playwright/Crawlee against Google = recurring breakage + proxy bills that dwarf the $32/1k official price for our volumes.
- **Cheaper compliant paths to the same data:** Google Places API free 5k/mo for live lookups (no persistence), Foursquare (500 free calls/mo, richer than OSM), Overture bulk (phones/websites/emails at scale, storable forever), Geoapify (OSM+storable). Any 30-day-sampled combination of these beats scraping on cost, stability, and legality.
- **What NOT to do:** no Google Maps scraping, no Google Search scraping, no SERP-proxy services that resell Google data (SerpAPI-style) - same legal exposure with an intermediary, plus per-query cost that exceeds Places API retail. **Do not** fetch `google.com/maps` or `google.com/search` from tarima code, ever; this should be a coded, testable prohibition.
- **Crawler/extractor choice for tier 2 (venue sites, event-listing sites, company sites):**
  - **JSON-LD + tel/mailto extraction**: a ~100-line parser over cauce's already-fetched markdown/HTML. Cauce's `fetch_and_index` (MCP tool, live today) gives us: SSRF-guarded fetch, 1 rps/burst-2 politeness bucket, 30 s timeout, 1 MB cap, `dom_smoothie` readability extraction, pages stored ≤200 KB markdown in SQLite with FTS5 (crates/cauce-core/src/archive/{mod.rs:93,extract.rs:29,fetch.rs:42-187}). **Gap:** it returns `{title, markdown}` only - no structured field column, no JSON-LD parsing, no robots.txt compliance on outbound fetches (verified absence). So: run extraction in tarima (Node) over cauce-returned markdown, or add a tiny JSON-LD step to cauce upstream.
  - **Crawlee/Playwright/crawl4ai/Firecrawl**: rejected for the VPS footprint - Playwright-class browsers are 300-800 MB RSS each and a 6-core/11 GB box shared with tarima + cauce + Litestream cannot host a crawl farm. Firecrawl is a paid SaaS with unclear data-rights chain. crawl4ai is Python+Playwright, same footprint problem.
  - **Recommended stack:** cauce `fetch_and_index` for fetch+readability (already deployed, already rate-limited) + tarima-side JSON-LD/regex extractor + **robots.txt check before fetch** (tarima-side, cached per host 24 h) + global cap (e.g. ≤30 fetches/agent-run, ≤2 hosts in flight, 1 rps per host) + **LLM-extraction fallback** through the existing Bifrost gateway only when regex/JSON-LD find nothing, capped at e.g. $0.05/page and $1/day via a spend-ledger row (brioso pattern: `packages/dispatch/src/spendLedger.ts` per-runtime daily cap gating eligibility).
- **robots.txt & rate-limit policy (tier-2 constitution):** fetch `https://host/robots.txt` first (24 h host-cache); honor `Disallow` for the target path and `Crawl-delay` (min 1 s); identify as `tarima-bot/0.1 (+site)`; never fetch login-walled or paywalled pages; 3 strikes per host → host-level cooldown 1 h (brioso keyRing pattern).

## 1.4 Recommended tier ladder

```
tier 0  cache            tarima SQLite (see deliverable 2). Hit ⇒ 0 provider calls, <5 ms.
tier 1  fast API fan-out (parallel, hedge at P90+300 ms, deadline 3.5 s)
          anchor geocode:   Photon (default) → Geoapify geocode (hedge)
          place search:     Geoapify Places → Overpass public (hedge; ≤100/day budget counter)
          place metadata:   OSM tags (from search) → FSQ Places details (shortlist only, 500/mo)
          sponsors:         local cauce /api/search (bing+brave+ddgs fan-out + RRF)
tier 1.5 bulk backfill   Overture places parquet → DuckDB → tarima SQLite per metro (monthly),
                          FSQ OS Places as second source. Powers offline radius search + contact prefill.
tier 2  crawl/enrich     cauce fetch_and_index (≤3 URLs/venue) → tarima JSON-LD/NAP extractor
                          robots-checked, 1 rps/host, ≤30 fetches/run, host cooldowns
tier 3  LLM extract      only when tier 2 fetched a page but found no structured contact:
                          Bifrost gateway call, strict-JSON schema, cost cap $0.05/page, $1/day ledger
never   Google Maps/Search scraping, resold SERP APIs, guessed emails
```

**Honest note on our own tier-1 text arm:** cauce's `bing` and `brave` engines are *declarative HTML scrapers* (CSS-selector SERP specs, `crates/cauce-engines/src/declarative/`), and `ddgs` is an exec engine shelling to a Python DuckDuckGo client. That is SERP scraping of upstream engines, done by our own infrastructure at low volume (live instance today: 6 bing + 5 brave requests). It is a materially different posture from vendored SERP APIs or Google scraping - no ToS acceptance, no per-query resale, low volume - but it is the same *category* of activity, and the reason it is acceptable is that it is our own metasearch at internal scale, not Google Maps. If the owner wants an even cleaner posture, Brave Search API (2k/mo free) can replace the Brave scraper inside cauce with a one-engine YAML swap; cauce already has a `replay` engine kind for offline tests.

**Fan-out & resilience rules (imitating cauce's pipeline, which is live-proven, and brioso's chain):**
- Tier-1 providers run **in parallel with RRF-style merge** when they are independent (Geoapify + Overpass both hit; union by normalized name+distance). Hedge the slower engine only when merged results < 5 (cauce `waves.rs` behavior: hedge at P90 latency + floor 300 ms, ceiling 1500 ms, hard deadline 3000 ms).
- **Circuit breaker per provider**: 3 failures in 5 min → open, 30 s→300 s jittered half-open probes (copy cauce `health.rs` semantics; the live cauce instance showed a real OPEN breaker today for the ddgs engine - the pattern works). Overpass's 502-at-capacity (observed 3× today) is exactly what this protects against.
- **Per-provider daily budget counters in SQLite** (Overpass ≤100 queries/day; Google ≤50 live calls/day if approved; FSQ ≤450/mo leaving margin; LLM $1/day). Brioso's spendLedger is the shape: soft cap → provider marked `over_budget` → skipped in the chain walk.
- **Timeouts:** geocode 2 s, place search 8 s (Overpass p50 was ~30-60 s today, so Overpass runs *async-first* - accept results only within deadline, else answer from cache/Overture and backfill later), cauce search 3.5 s, tier-2 fetch 30 s, tier-3 LLM 20 s.
- **Degraded results are marked degraded** and earn only a short cache TTL (cauce: degraded fan-out gets 60 s TTL - steal this).
- **Honest-contact rule:** `contact_email`/`contact_phone` fields are set ONLY from (a) OSM/Overture/FSQ provider fields, (b) JSON-LD `email`/`telephone`, (c) `mailto:`/`tel:` on the venue's own domain. Never from LLM free-text output, never guessed from name patterns (`info@name.com` is a guess → forbidden), never from SERP snippets. A venue with no contact goes to the explicit `needs_contact` bucket with `contact_source = null`. Schema carries `contact_source` (osm|overture|fsq|jsonld|page_text|human) so every contact is auditable.

---

# OSM test results

Method: 15 requests total against public endpoints (1 Photon geocode + 14 Overpass `around:` queries, node+way with `out center tags`, radius 1500 m around 37.8719,-122.2585; one regex-name query at 2500 m), descriptive UA `tarima-research-bot/0.1 (contact: dev@tarima.local) osm-research-15req-budget`, ≥1.1 s between requests, exponential backoff on 502s. Raw JSON + `log.txt` in `/tmp/tarima-osm-test/`. Date: 2026-11-05.

**Request outcomes (14 Overpass + 1 Photon):** 12× HTTP 200, **3× HTTP 502 "server at capacity"** (needed retries with 40-45 s backoff; three distinct queries hit the 502 wall at least once). Photon geocode: 200 in 1.9 s, returned "University of California, Berkeley" at 37.8755,-122.2391 (~1.7 km east of the requested bias point - good enough for an anchor, house-number precision varies).

**Latency & payload (successful Overpass queries):** min 27.2 s / median ~34 s / max 59.8 s per query; payloads 1.7 KB (breweries) to 197 KB (opening_hours query). The food query (amenity=restaurant|cafe|fast_food|bar|pub) took 39.7 s and returned 159 KB / 325 elements. **Overpass public is a background-batch tool, not an interactive one** - a 30-60 s latency is disqualifying for the synchronous agent turn and confirms the async-first tier-1 design.

**Element counts per category (radius 1500 m):**

| Category | Elements | nodes | ways(+rels) |
|---|---|---|---|
| food (amenity=restaurant/cafe/fast_food/bar/pub) | 325 | 319 | 6 |
| supermarkets/convenience/greengrocer | 23 | 18 | 5 |
| all shops (any `shop=*`) beyond grocery | 208 | 200 | 8 |
| event venues (amenity=events_venue/community_centre/conference_centre/multipurpose/social_facility) | 15 | 9 | 6 |
| breweries/brewpubs (craft=brewery/brewpub filter) | 2 | 2 | 0 (4 elements in the union carry `craft=brewery`) |
| named "rooftop" anywhere (2500 m) | **0** | 0 | 0 |
| unique elements across all queries (deduped) | 1515 | 1132 | 383 |

**Tag completeness (the numbers that drive the cache/eval design):**

| Tag group | food (n=325) | grocery (n=23) | shop_other (n=208) | event venues (n=15) |
|---|---|---|---|---|
| name | 99% | 95% | 99% | 93% |
| addr:housenumber+street | 85% | 82% | 86% | 66% |
| addr:postcode | 44% | 34% | 42% | 46% |
| phone (phone/contact:phone) | **38%** | 26% | 33% | 26% |
| website (website/contact:website/url) | **60%** | 39% | 46% | 53% |
| email (email/contact:email) | **5%** | 0% | 4% | 6% |
| opening_hours | **46%** | 34% | 40% | **6%** |
| cuisine | 78% | n/a | 2% | n/a |
| **capacity** | **0%** | 0% | 0% | **6%** (1 element) |
| wheelchair | 27% | 26% | 13% | 6% |
| brand | 9% | 17% | 8% | 0% |

**Contactability (phone OR website OR email):** food 214/325 = **65%**; shop_other 56%; event venues 8/15 = 53%; grocery 43%. If "contactable" required a phone (the channel tarima's outreach actually uses): food 39%, venues 26%.

**Nodes vs ways:** overall 1132 nodes / 383 ways (75/25). But *within the categories that matter* the split is extreme: food is 319 nodes / 6 ways (98% nodes), grocery 18/5, event venues 9/6 (40% ways - real venues are buildings/polygons). The remaining 944 "other" elements (matched only by capacity/opening_hours/contact tags) are 586 nodes / 358 ways and are mostly building outlines. Consequence: **ways matter exactly for the venues we care about** (a brewery taproom or community centre is a building polygon), so the extractor must always read `center` for ways, and the ranking must handle centroid-vs-entrance distance error (a 200 m building centroid can mis-rank an otherwise perfect venue).

**Duplicates:** 40 names appear on >1 element (chains like Peet's ×4, Bongo Burger ×3) plus likely node+way double-mapping. Dedup by normalized name + haversine < 50 m is required; the deleted `upsertCandidates` (city,name) logic solves part of this.

**Closed/disused:** 214 elements in radius carry `disused:*` (205 nodes + 9 ways; 71 KB payload; e.g. `disused:amenity=restaurant` for a former "Berkeley Thai House", `disused:amenity=bank`). Only 1 of the 214 also has a live `amenity`/`shop` tag (i.e. a re-tagging race), and **0 carry `end_date`** - so `end_date` is not a usable closure filter, `disused:*` is the only signal. OSM keeps corpses: **exclude `disused:*` in every query and in every stored row.** Relative to the 325 live food venues, the disused set is comparable in size - ignoring it would put roughly one dead venue per two live ones into results.

**Sample record (Triple Rock Brewery, node 282601069):** name, full addr (1920 Shattuck Ave, 94704), phone +1 510 8432739, opening_hours `Tu, Sa 12:00-22:00; We-Fr 12:00-23:00; Su 12:00-21:00`, website, craft=brewery, microbrewery=yes, outdoor_seating=yes - a *perfect* event-venue record. The good tail is very good; the missing 35-60% is the problem.

**Failure modes observed:** (1) 502-at-capacity requiring backoff - validates circuit breaker + the <100/day budget; (2) 27-60 s latencies - validates async-first + tier-0 cache; (3) zero results for "rooftop" name search even at 2500 m - OSM cannot serve vibe/feature queries ("rooftop", "private room", "good for 40 people"); (4) capacity essentially unmapped (1/546 venues) - capacity must come from tier 2 (venue sites/private-events pages) or FSQ, never from OSM; (5) disused places pollute results (214); (6) email is nearly absent (≤6%) - email contacts must come from venue websites (tier 2) or Overture.

**What this means for the tier ladder:**
- OSM **alone can serve**: discovery + location + category + (for ~2/3 of places) a website/phone. It answers "brewery near Oakland" with ranked, mappable, mostly-contactable results at $0.
- OSM **cannot serve**: capacity (0%), email (5%), event-venue hours (6%), vibe queries (0 rooftop hits). Those fields require tier 1.5 (Overture: emails/phones/websites from Meta/Bing sources), tier 1 escalation (FSQ details for shortlisted venues: hours, phone, verified website), tier 2 (venue's own site: JSON-LD hours/email/capacity hints), and tier 3 (LLM reading an events page for "seats 80").
- Overpass-public stays in the ladder **only** as the hedge/batch arm with a hard ≤100 queries/day counter; Geoapify (3k/day, storable) becomes the synchronous tier-1 default precisely because it is OSM-quality without the overloading.

**Numbers for the cache/eval design (from this test):** 1,515 unique OSM elements in a 1.5 km Berkeley radius; 325 food / 23 grocery / 208 other shops / 15 event venues. A Berkeley-metro Overture ingest would hold ~10-30k rows (fits the ≤35 MB estimate in the transcript; a bay-area OSM filtered extract lands in the same range). Contact expectations for eval gates: with OSM+Overture, ≥60% of food venues should have website, ≥40% phone, ≥8% email; capacity >5% is a tier-2 success metric; opening_hours ≥50% after FSQ/JSON-LD enrichment. Cache TTLs keyed to field volatility: hours 7 d, phone/website 90 d, capacity 90 d, location 1 y.

---

# Deliverable 2 - Cache and matching design

## 2.1 The query-matching problem

A cached search must answer: *does a stored result answer this new question?* Candidate mechanisms, compared on realistic event-planner traffic:

| Mechanism | How it matches | Expected hit rate on realistic queries | Failure modes | Verdict |
|---|---|---|---|---|
| **A. Exact normalized-key hash** (sha256 of normalized query + rounded anchor + radius bucket) | identical question ⇒ identical key | **Low-moderate**: catches exact repeats ("rooftop venue 40 people Berkeley" re-asked, agent retries, double-clicks, turn replays). Planners rephrase constantly, so long-tail misses | False positives: none (hash equality is exact). False negatives: everything rephrased or anchor moved by 200 m | **Implement.** It is free, it is the tier-0 fast path, and agent loops *do* repeat queries verbatim |
| **B. Geo-bucketed keys** (geohash/H3 cell + radius-coverage check) | store per-cell result sets; a query at anchor X resolves to all cells its radius covers; nearby anchors reuse | **High for the geo part** (a Berkeley query and an "Northside Berkeley" query share cells), **zero for the text part** ("rooftop" vs "brewery" still mismatch) | False-positive reuse across category if only location buckets (mitigate: bucket key = cell × category); stale-area risk if a cell covers two distinct neighbourhoods (use H3 res ~9, ≈ 0.1 km² cells) | **Implement for place search**: key = `h3(res9, anchor) × category × radius-bucket`, retrieve super-set cells, filter by true haversine ≤ requested radius at read time. Simple, deterministic, no embeddings |
| **C. Lexical (SQLite FTS5 + BM25/trigram)** | rank cached query texts against the new query | **Moderate**: "brewery near Oakland for a meetup" vs "oakland breweries meetup space" share tokens; fails on synonyms (venue/hall/space; rooftop/terrace) | False positives: "Berkeley rooftop" hits "Berkeley roof repair" if trigram-only; area words dominate ("Berkeley" is in every query) - must down-weight geo tokens | **Implement lightly**: cauce already proves the pattern (FTS5 cache + Jaccard ≥ 0.8 gate, `pipeline/cache.rs:294`). Use BM25 as a *fallback lookup*, always gated by geo-overlap + category match before serving |
| **D. Semantic (embeddings + sqlite-vec)** | cosine similarity of query vectors | **High apparent hit rate, low precision for geo**: "rooftop venue" vs "rooftop bar" vs "roof repair" all neighbor; embeddings know nothing about radius/anchor | Wrong-area reuse (vector matches "Berkeley rooftop" to "Oakland rooftop"); stale reuse; model drift on re-embedding | **Defer.** If later: `bge-small-en-v1.5` (33 M params, 384-dim, 127 MB fp32 / 32 MB int8 ONNX, MIT license, CPU-friendly, HuggingFace model card) running in-process via transformers.js/fastembed-style ONNX; embedding one query ≈ 10-30 ms CPU; sqlite-vec loads as an extension into the existing better-sqlite3 DB (npm `sqlite-vec`, GitHub asg017/sqlite-vec). No paid API, no key. Only worth it if evals show lexical F1 < 0.6 on paraphrases |
| **E. Hybrid BM25 + vector fused with RRF** | rank fusion of C and D | Best recall of all; cauce's `search_archive` proves the fusion mechanics (`RrfMerge`, k=60, `merge.rs:27`) - **but note: cauce's archive is BM25+BM25 over two stores, not BM25+vector**; the RRF merge itself is the reusable part | Same as D plus opacity (why did this cache hit?) | **Phase-later.** Copy `RrfMerge` semantics (weight/(k+rank), dedupe by normalized key) when/if tier D lands |

**Decision: tarima keeps its own cache tables; do NOT reuse cauce's cache/index as the place cache.** Justification: (1) cauce's `CacheKey` preimage is web-search-shaped (q/page/lang/time_range/safesearch/engines) and its `CachedSearch` payload is SERP results - no geo columns, no structured place fields (`SearchResult` = url/title/snippet only); (2) cauce is one process/one SQLite file, not a multi-tenant store - tarima writing place rows through cauce's admin API would be fragile and unversioned; (3) the semantics we need (per-field TTL, negative caching, geo cells) don't map onto its single `expires_at + stale_grace` row. What we DO take from cauce: the *behaviors* - exact-key + gated-lexical fallback, SWR with stale flag, degraded-result short TTL, singleflight admission, no negative caching of empty failures. And sponsors' text searches can still go *through* cauce's own `/api/search`, whose cache then serves repeated sponsor queries for free - tarima stores only the fused result pointers.

## 2.2 Proposed schema (tarima-local, migration 0010)

```sql
-- place cache: one row per (h3 cell × category) = materialized mini-catalog
CREATE TABLE place_cache (
  cell TEXT NOT NULL,            -- H3 index res 9
  category TEXT NOT NULL,        -- 'food'|'bar'|'event'|'shop'|'sponsor_local'|...
  radius_m INTEGER NOT NULL,     -- nominal radius materialized (default 1500)
  payload TEXT NOT NULL,         -- JSON: venue rows (deduped, sorted by distance)
  source TEXT NOT NULL,          -- 'geoapify'|'overpass'|'overture'
  provider_run_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,   -- per-source TTL
  stale INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (cell, category)
);
-- query-key cache: exact repeats of any shaped query (venues AND sponsors AND geocodes)
CREATE TABLE query_cache (
  query_hash TEXT PRIMARY KEY,   -- sha256(normalized query + rounded anchor + radius + kind)
  kind TEXT NOT NULL,            -- 'venue_search'|'sponsor_search'|'geocode'
  payload TEXT NOT NULL,
  degraded INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, refreshed_at INTEGER NOT NULL
);
-- the revived, real version of today's orphaned search_cache: keep the table, add columns
ALTER TABLE search_cache ADD COLUMN payload TEXT; ADD COLUMN kind TEXT; ADD COLUMN expires_at INTEGER;
```
(Implementation detail: reuse the existing `search_cache` table rather than adding `query_cache`; the migration is `addColumnIfMissing` patches in `apps/api/src/db/index.ts` - that is how this codebase patches, per `db/index.ts:89-137` - plus a drizzle file `0010_place_cache.sql` for fresh installs.)

**TTL and staleness policy per field** (justified by the OSM test field-volatility and general knowledge of business-data churn):
- geocode anchor: 30 d (cities don't move)
- place-list payload (names/locations/categories): 14 d
- opening_hours: 7 d (highest churn field; also the field users notice when wrong)
- phone/website/email: 90 d
- rating: 7 d (when a provider supplies it)
- capacity/enriched flags: 90 d or until manually edited
- negative place results ("no breweries in this cell"): cache 24 h, never serve a negative past 24 h without a re-check
- degraded results: 60 s (cauce rule)
- **SWR:** on expiry, serve stale + refresh in background (cauce semantics; the deleted `venue-search.ts` did exactly this too - `refreshing: true` in the frozen contract), stale grace 6 h.
- **Invalidation:** manual re-search button in agent reply ("search again, ignore cache"), and provider-failure-triggered demotion (a provider 5xx marks the affected cells' `source` stale early). No push invalidation - venue data changes slowly enough.

**Realistic hit-rate expectations (state the model explicitly):** with tier-0 = exact-key + geo-cells, an event-planner workload ("look for venues" repeatedly around one or two cities during a session) should see **~40-60% tier-0 hits**: same-session repeats and category+area repeats dominate; paraphrases and new neighbourhoods miss. Lexical fallback adds maybe 5-15% more with a precision cost - gate it hard. Semantic would add more recall but is deferred until measured.

**Storage:** trivial. Berkeley+Oakland metro at OSM density ≈ 3-6k venues × ~1 KB JSON ≈ single-digit MB; the OSM test's raw 1.5 km payload was 159 KB. SQLite with WAL (already the mode) absorbs this without noticing; FTS5 on venue names is <2 MB and gives the agent's "that place we found last week" recall for free.

## 2.3 Minimal first version → upgrade path

- **V0 (phase 1):** exact `query_hash` cache only (revive `search_cache` with TTL columns) + persist results into `venue_catalog`. This already converts repeat queries to 0-provider-call. One day of work including tests.
- **V1 (phase 2):** add `place_cache` geo-cell table + haversine trim + SWR + negative caching + per-provider budget counters.
- **V2 (phase 5, optional):** FTS5 lexical fallback over `search_cache.query` (copy cauce's Jaccard-gate idea) and/or sqlite-vec + bge-small if evals show paraphrase misses dominate.
- **Never:** serving a cached result whose `radius_m` doesn't cover the requested radius without re-filtering by distance at read time.

---

# Deliverable 3 - Plan and measurement

## 3.1 Phases (each ≤ 1 day; ranked so phase 1 already returns real venues)

**Phase 0 - keys and stance (owner decisions, no code).** Approve: Geoapify key (free, no card); Overpass-public usage policy (≤100/day, custom UA); Google Places key - *optional, live-only*, recommend deferring; FSQ key (free 500/mo) - optional phase 3; embedding provider - none (defer); scraping stance - venue-sites-only via cauce, Google never. Deliverable: signed-off decision table (§3.4).

**Phase 1 - `search_venues` tool: geocode + Geoapify + cache + persist (THE phase that makes "look for venues" work).**
- Files: `apps/web/agent/tools/search_venues.ts` (new), `apps/api/src/services/venue-search.ts` (recreate from git `255ad59^`, rewritten around Geoapify+cache), migration `apps/api/drizzle/0010_place_geo.sql` + BOOTSTRAP_DDL + `addColumnIfMissing` patches adding `latitude REAL, longitude REAL, provider TEXT, opening_hours TEXT, contact_source TEXT, rating REAL, last_verified_at INTEGER` to `venue_catalog`; extend `packages/contract/src/venue.ts` schemas with lat/lng/distance/source fields (the frozen contract gets a superseding version bump).
- Behavior: geocode (Photon keyless; Geoapify hedge) → Geoapify Places circle-filter (categories mapped from tool input) → upsert `venue_catalog` (external_id = provider id; adopt-on-(city,name)-collision like the deleted `upsertCandidates`) → write `search_cache` row → return ranked list (distance, needs_contact bucket).
- Env: `GEOAPIFY_API_KEY` (required, free); `TARIMA_PLACE_OVERPASS_BUDGET=100` (optional).
- Tests (vitest, temp-DB pattern of `send_email.test.ts`): recorded Geoapify fixture JSON in `apps/web/agent/tools/fixtures/geoapify-berkeley.json` (captured once by hand, replayed offline - no live network in tests); assert: haversine ≤ radius, dedup by external_id, cache hit ⇒ 0 provider calls (mock fetch counter), SWR stale serve + background refresh flag, no-contact bucket honesty, approval.ts registration as read-only (no prompt).
- Reads as: user says "look for rooftop venues in Berkeley" → agent calls tool → real Berkeley venues with distance, most with website/phone, ~0 false contacts.

**Phase 2 - Overpass arm + Overture backfill (depth + offline base).**
- Files: `apps/api/src/services/providers/overpass.ts` (port from `c97e7a3^:packages/venuesearch/src/overpass.ts` - keep retry/backoff/timeout + honesty rule, add daily budget counter + breaker), `apps/api/scripts/backfill-overture.ts` (new: DuckDB-over-S3 one-liner per metro → CSV → insert into `venue_catalog` with `provider='overture'`, `contact_source='overture'`), `packages/venuesearch`-equivalent seam restored under `apps/api/src/services/providers/` (single `PlaceProvider` interface, brioso-style ordered chain).
- Env: none (Overpass keyless; Overture is public S3; DuckDB is a dev-time script run on the laptop, not the VPS).
- Tests: recorded Overpass fixtures from `/tmp/tarima-osm-test/*.json` (we already have 15 real recorded responses!) - replay asserts parsing, disused-exclusion, dedup, 502→breaker-open behavior with a fixture-502; Overture CSV fixture with 20 rows incl. a permanently_closed row (assert excluded).
- Deliverable: venue_catalog holds ~1-3k real Berkeley/Oakland places before any live call; "brewery near Oakland" answered from cache/offline base with distance ranking.

**Phase 3 - metadata enrichment ladder (FSQ + tier-2 crawl + JSON-LD).**
- Files: `apps/api/src/services/providers/foursquare.ts` (shortlist-only details: hours, phone, website), `apps/api/src/services/enrich.ts` (orchestrates: for top-K shortlisted venues lacking contact → cauce `fetch_and_index` MCP call → JSON-LD/NAP extractor `apps/api/src/services/extract/jsonld.ts` + `nap.ts` → write `contact_source`), robots-check helper with 24 h host cache.
- Env: `FSQ_API_KEY` (optional), `CAUCE_BASE_URL=http://search.localhost:4479` (required for this phase), `TARIMA_CRAWL_BUDGET_PER_RUN=30`, `TARIMA_LLM_EXTRACT_DAILY_CENTS=100`.
- Tests: recorded venue-website HTML fixtures (one WordPress site with JSON-LD Restaurant block, one bare HTML with tel:/mailto:, one robots.txt-disallowed case, one LLM-fallback case behind a mock gateway) - assert extraction fields, contact_source provenance, budget ledger decrement, and that LLM output can NEVER set a contact field directly.
- KPI gate: metadata completeness ≥60% phone / ≥50% hours on the Berkeley golden set.

**Phase 4 - sponsor discovery + board write-back.**
- Files: `apps/web/agent/tools/search_sponsors.ts` (cauce `/api/search` → rank by domain authority heuristics → return companies with site), `apps/web/agent/tools/add_candidate.ts` (entity write, reusing `createEntity` service for MCP-identical rows), dedup rule: `domain` column on `entities` + `venue_catalog`, same domain = same company two roles.
- Env: none new (cauce already deployed; its Exa MCP key optional).
- Tests: recorded cauce response fixture (we can capture one from the live local instance); add_candidate idempotency; domain-dedup unit test.

**Phase 5 - optional upgrades (explicitly deferred until KPIs demand):** sqlite-vec + bge-small semantic cache fallback; self-hosted regional Overpass; Google Places live-lookup escalation (owner-approved, no persistence); per-field SWR refreshers; agent-side re-ranking LLM pass.

## 3.2 Eval design

- **Golden sets (fixed anchors, deterministic):** `evals/place/golden-venues.jsonl` - 25 queries around anchor 37.8719,-122.2585 (Berkeley campus) with expected properties, e.g. `{q:"rooftop venue 40 people Berkeley", must:{radius_m:1500, category_any:["bar","restaurant","event"]}, expect:{min_results:5, contactable_rate_min:0.5}}`; plus 10 sponsor queries (`{q:"local coffee roaster that would sponsor a tech meetup", expect:{domain_official:true}}`). `evals/place/golden-sponsors.jsonl` likewise. One row = one recorded provider transcript (request + response) so the whole eval replays offline.
- **Deterministic checks (no LLM judge in the gate):** haversine(actual, anchor) ≤ radius_m for every row; schema validity against the new contract schemas (valibot parse); dedup invariant (no two rows with same external_id or same normalized name < 50 m apart); contact-found rate ≥ threshold per golden row; **no-fabricated-contact invariant**: every returned `contact_email` ∈ {provider-sourced, jsonld-sourced, page-sourced} provenance set - an LLM-derived email fails the eval by construction; rating/capacity fields NULL-tolerant but type-checked.
- **KPIs and targets:** tier-0 cache hit rate ≥40% on a scripted 10-turn session replay; p95 latency: cache hit <50 ms, tier-1 geocode+search <4 s, Overpass-arm async backfill accepted; cost per cold query ≤ $0.002 (Geoapify free tier amortized, FSQ amortized, zero LLM unless fallback); metadata completeness on golden set: phone ≥40% (OSM floor measured today: 38%), website ≥60% (measured: 60%), email ≥8% only *after* phase 3, capacity >5% only after phase 3; precision@5 ≥0.6 human-spot-checked once per phase on a 25-row sample.
- **Offline replay:** every provider client takes a `fetch` injection; fixtures = recorded JSON under `fixtures/` (Geoapify captured live once during dev; Overpass already captured - reuse `/tmp/tarima-osm-test/*.json`; cauce captured once; FSQ captured once at signup). Vitest runs 100% offline; a separate `npm run eval:live` script (opt-in, budget-capped) replays the golden set against live providers monthly to detect drift (brioso `evals-online` pattern, minus Phoenix).
- **Regression tripwire:** after any provider change, `eval:offline` must pass with zero fixture edits; if a fixture must change, that's a flagged provider-behavior change in the PR.

## 3.3 Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Overpass public 502s (observed 3/12 today) | High | Medium | breaker + budget counter + Geoapify-first ordering + async backfill; Overture offline base means answers survive provider death |
| Geoapify free-tier tightening or ToS change | Low | Medium | provider seam makes swap cheap; OSM direct (self-host later) is the same data; Overture bulk is independent |
| Google Places temptation returns (quality gap visible) | Medium | Medium | decision table records the caching ban; live-only pattern documented; Overture+FSQ cover most gaps compliantly |
| Crawl gets us blocked / host complains | Medium | Medium | robots-check, 1 rps/host, UA string, ≤30 fetches/run, host cooldown, contact email in UA; no Google properties ever |
| LLM extraction hallucinates a contact | Medium | High (trust) | tier-3 may only extract *existing text* into fields with provenance; regex-verify email format; honest-contact rule enforced in code + eval invariant |
| Venue data stale (hours wrong) | Medium | Low-Medium | 7 d hours TTL, SWR refresh, `last_verified_at` shown to user; agent instructed to say "hours as of <date>" |
| SQLite growth / lock contention with tarima's main DB | Low | Medium | WAL already on; place tables are append-mostly; if contention appears, move place tables to a second attached DB file |
| VPS memory (cauce + tarima + crawls) | Medium | Medium | no browser engines by policy; cauce fetch is Rust + capped; LLM via existing gateway; monitor RSS |
| Vendor pricing shifts (FSQ already repriced June 2026) | Medium | Low | all paid providers optional; KPIs defined so a provider can be dropped without redesign |

## 3.4 Open decisions for the owner

1. **Google Places API key:** approve a billing-enabled key for *live-lookup-only* (no persistence, ≤50 calls/day cap) - or decline entirely (recommended until OSM+Overture quality measurably fails). Default if unanswered: decline, revisit at phase-3 KPI review.
2. **Scraping stance:** approve "venue/company own-sites only, via cauce fetch, robots-checked" + explicit never-Google rule. Default: approve (this is the proposed constitution).
3. **FSQ key:** approve free signup (500 calls/mo) for shortlist metadata. Default: yes.
4. **Geoapify key:** approve free signup (3k/day). Required for phase 1. Default: yes.
5. **Embedding provider:** none (local bge-small deferred). Approve the deferral. Default: defer.
6. **LLM-extraction budget:** approve $1/day cap via Bifrost gateway for tier 3. Default: yes.
7. **Contract break:** `packages/contract/src/venue.ts` frozen schemas need a superseding version with geo fields - approve the version-bump mechanism. Default: supersede.

---

## Appendix A - verified-source log (checked 2026-11-05)

| Claim | Source | URL |
|---|---|---|
| Google Text/Nearby Search Pro 5k free then $32/1k; Details 5k free then $17/1k | Google Maps Platform price list ("Last updated 2026-11-03") | developers.google.com/maps/billing-and-pricing/pricing |
| No caching beyond place_id (indefinite) + lat/lng (30 d); "No Scraping" clause text | Places API policies; Maps Service Specific Terms §3.2.3/§14.3 (quoted in N.D. Cal. filing) | developers.google.com/maps/documentation/places/web-service/policies |
| Geoapify free 3,000 credits/day, ≤5 rps, commercial OK, cache/store/redistribute allowed | Geoapify pricing page FAQ + Places API FAQ | geoapify.com/pricing, geoapify.com/places-api |
| Radar: no free tier; Places Search "starting at $2.00/1k" | Radar pricing FAQ | radar.com/pricing |
| FSQ Places API: 500 free Pro calls then $15 CPM; v3 deprecated 2026-05-15; June 2026 rate change | Foursquare pricing + Upcoming Changes (updated ~2026-10) | foursquare.com/pricing, docs.foursquare.com/developer/reference/upcoming-changes |
| FSQ OS Places: 100M+ POIs, Apache-2.0 + NOTICE | FSQ Open Source site + notice | opensource.foursquare.com/os-places |
| Overture 2026-10-21.0: 88.4M places, +8.5%, BrightQuery expansion; DuckDB/S3 query guide; places schema has emails/phones/websites/socials/brand, NO opening_hours (hours = planned extension) | Overture release notes, DuckDB guide, Place schema, schema-v2 blog | docs.overturemaps.org/blog/2026/10/21/release-notes/, /getting-data/duckdb/, /schema/reference/places/place/, /blog/2026/09/16/schema-v2/ |
| Overture places license: CDLA-Permissive 2.0 per source; OSM portions ODbL | Overture attribution page | docs.overturemaps.org/attribution/ |
| Overpass policy: <10k/day one-off, apps ÷100 → <100/day, custom UA, 429/406→pause 30 s, overloaded notice | OSM Wiki Overpass API (checked today) | wiki.openstreetmap.org/wiki/Overpass_API |
| Photon: keyless, "be fair", throttled, no availability guarantee | photon.komoot.io Terms of Use | photon.komoot.io |
| Nominatim: 1 req/s, no bulk/auto service embedding | OSMF usage policy | operations.osmfoundation.org/policies/nominatim/ |
| LocationIQ free 5k/day, 2 rps, link-back commercial use | LocationIQ pricing | locationiq.com/pricing |
| Brave API: $5 free credit/mo per plan ($20 across plans), Search plan $5/1k requests | Brave launch blog (2026-02-12) + pricing page | brave.com/blog/most-powerful-search-api-for-ai, brave.com/search/api |
| Exa free $10/mo + $10 onboarding; Lite $4/1k, Auto $7/1k, +$1/1k per extra result | Exa pricing + docs | exa.ai/pricing, exa.ai/docs/admin/pricing |
| Tavily 1,000 credits/mo free, then ~$8/1k | Tavily docs credits & pricing | docs.tavily.com/documentation/api-credits |
| Cauce behaviors: SWR, singleflight, breaker, RRF k=60, degraded 60 s TTL, no negative caching, fetch_and_index limits (1 rps, 1 MB, 30 s, 200 KB markdown, no robots compliance, no structured fields, no geo) | cauce source (read today) + live instance | crates/cauce-core/src/... (paths in deliverable 2), search.localhost:4479/health + /api/engines |
| Brioso patterns: ordered fallback chain, keyRing cooldowns, spendLedger daily caps, layered config, JSONL golden evals | brioso source (read today) | packages/dispatch/src/{sweep.ts,keyRing.ts,spendLedger.ts,gatewayConfig.ts}, packages/jobs/src/fallback.ts |
| bge-small-en-v1.5: 33.36 M params, 384-dim, 512 tokens, ONNX 127 MB fp32 / 32 MB int8, MIT | HuggingFace model card | huggingface.co/Teradata/bge-small-en-v1.5 |
| sqlite-vec: loadable extension, npm/pip/cargo distribution | sqlite-vec install docs | github.com/asg017/sqlite-vec |
| Scraping case law: hiQ v LinkedIn (9th Cir. 2019/2022), Meta v Bright Data (N.D. Cal. 2024), RyanAir v Booking (D. Del. 2024), Lovly v Fox (11th Cir. 2024) | court records and summaries | docs.justia.com (Meta v Bright Data order), storage.courtlistener.com, tradesecretslaw.com, ipde.com |
| OSM test numbers (all §"OSM test results") | our own live run, raw JSON kept | /tmp/tarima-osm-test/ |

**Transcript claims corrected by verification:** Radar "100k requests/month free" - no longer true (no free tier today). Foursquare "10k free calls/month" - now 500 free Pro calls/mo since June 2026. "Overture has no opening hours" - confirmed still true (extension planned, not shipped). "Geoapify 3k/day free" - confirmed. "Photon needs 64 GB RAM self-hosted" - plausible for planet but irrelevant at our scale; regional extract far smaller **[unverified detail - size a Bay-Area extract before any self-host decision]**.

## Appendix B - unchecked / deferred items (time box)

- FSQ Places API result-storage rights not verified at signup-terms level (marked in table).
- LocationIQ storage terms not verified (moot - we skip it).
- Google Maps Service Specific Terms fetched only via a court filing quote + policies page summary; full current §14.3 text not diffed.
- No live single-page fetches of venue websites were made (budget discipline); the JSON-LD extraction claims rest on the documented schema.org usage, not on sampled pages.
- DuckDB-over-S3 Bay-Area extract row-count not measured (estimate only); measure during phase 2.
- bge-small ONNX CPU latency on the 6-core VPS not measured; measure before phase 5.
- cauce `fetch_and_index` robots.txt gap: if phase 3 proceeds, either add robots compliance upstream in cauce or keep the tarima-side check (recommended) and note the gap in cauce's README/issue tracker.
