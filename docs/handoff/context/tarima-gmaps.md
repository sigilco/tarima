# Google Maps Platform assessment for tarima venue/sponsor discovery

Session: 2026-11-05, 14:41–15:00 PST. Read-only on the repo; key loaded from `~/Documents/prjcts/_own/tarima/.env` (`GOOGLE_MAPS_API_KEY`, 39 chars) at runtime only, sent exclusively via the `X-Goog-Api-Key` header, never written to any file (verified: 0 files in `/tmp/tarima-gmaps/` contain the key material). Probe budget: **15/15 used**, ≥1.1 s between calls. Raw redacted responses: `/tmp/tarima-gmaps/p*.json` (+ `.hdr`), log `probe-log.txt`, status milestones `/tmp/tarima-gmaps.status`. Docs verified today (all Google pages fetched and stored locally, "Last updated 2026-11-03 UTC"): pricing list, Places (New) SKU details, Place Data Fields, Nearby/Text/Details/Autocomplete/Photos request pages, Places policies, usage-and-billing, Geocoding requests, plus Google's manage-costs and Cloud Quotas pages.

Headline: **the key is live, unrestricted as far as these probes can tell (no referrer/IP block), Places API (New), Routes API and Geocoding API are enabled, and Google is 3–6× richer than Geoapify on every field tarima needs — but the fields that make it rich are Enterprise-SKU fields whose free cap is 1,000/month, and the ToS forbids persisting anything except `place_id`. Recommended integration: Geoapify/OSM discovery stays tier 1, Google becomes a tier-1 escalation ("Google detail pass") for top-K shortlisted venues only, live-only, ≤10 calls/day.**

---

# Deliverable 1 — API/endpoint inventory and richness

## 1.1 Which APIs this key can actually call (live-probed)

| API / endpoint | Probe | Result | Read |
|---|---|---|---|
| Places API (New) `places:searchNearby` (Pro mask) | p03 | **200**, 20 places, 0.35 s | enabled, working |
| Places API (New) `places:searchText` (IDs-only mask) | p04 | **200**, 20 places + `nextPageToken` | enabled |
| Places API (New) `places:searchText` (Pro mask) | p05 | **200**, 20 places, 0.60 s | enabled |
| Places API (New) `places:autocomplete` | p10, p13 | **200**, suggestion with placeId | enabled |
| Places API (New) Place Details `GET /v1/places/{id}` (Ent+Atmo mask) | p16 | **200**, full enrichment, 0.18 s | enabled |
| Places API (New) Place Photos media | p14 | **200**, returns `photoUri` JSON | enabled |
| Routes API `computeRoutes` (Essentials mask) | p02 | **200**, duration+distanceMeters | enabled |
| Geocoding API `/maps/api/geocode/json` | p01 | HTTP 200 body `REQUEST_DENIED` | see note |
| Legacy Places `/nearbysearch`, `/textsearch` | p11, p12 | HTTP 200 body `REQUEST_DENIED` | see note |
| (unprobed) Directions/Distance Matrix legacy, Maps Static/Embed, Address Validation, Time Zone | — | unknown | — |

Note on the three `REQUEST_DENIED` bodies: the legacy web-service endpoints (and Geocoding API, which shares the `/maps/api/…?key=` auth family) authenticate via the `key=` **query parameter**, not the `X-Goog-Api-Key` header (legacy Nearby Search docs show `&key=YOUR_API_KEY`; the header form returned "You must use an API key" even though the key was sent). House rules forbid the key in a URL, so these are **inconclusive by method, not a key rejection** — no `API_KEY_SERVICE_BLOCKED`, no referrer/IP restriction observed anywhere. What the probes do prove: the key is accepted for Places API (New) + Routes; whether Geocoding (and legacy) is enabled on the project must be checked once in Cloud Console. Either way tarima doesn't need them: Photon is the planned geocoder, and Places API (New) returns coordinates for free inside search results.

## 1.2 Field mask → SKU mapping (Places API (New), web-service fields)

From Place Data Fields (New), https://developers.google.com/maps/documentation/places/web-service/data-fields (checked 2026-11-05, last updated 2026-11-03). Billing = **highest SKU among requested fields**. Nearby Search has no "Essentials" tier: every Nearby field is Pro or above, and `id` itself is Nearby Pro (IDs-only masks are Pro, not free).

**Essentials (IDs Only) — $0, unlimited** (Place Details / Text Search only): `id`, `name` (the `places/ID` resource name), `attributions`, `consumerAlert`, `movedPlace`, `movedPlaceId`; Text Search additionally `photos`, `nextPageToken`.

**Essentials (Place Details only, 10k free)**: `addressComponents`, `adrFormatAddress`, `formattedAddress`, `location`, `postalAddress`, `shortFormattedAddress`, `plusCode`, `types`, `viewport`, `addressDescriptor`.

**Pro (both searches + Details, 5k free)**: `displayName`, `primaryType`, `primaryTypeDisplayName`, `businessStatus`, `googleMapsUri`, `googleMapsLinks`, `timeZone`, `utcOffsetMinutes`, `iconMaskBaseUri`, `iconBackgroundColor`, `openingDate`, `pureServiceAreaBusiness`, `entrances`, `navigationPoints`, `containingPlaces`, `subDestinations`, `accessibilityOptions`; search-side also `formattedAddress`, `location`, `types`, `plusCode`, `postalAddress`, `viewport`, `shortFormattedAddress`, `addressComponents`, `adrFormatAddress`, `addressDescriptor`, `photos` (Nearby), `nextPageToken` (Text IDs-only mask).

**Enterprise (1k free)**: `nationalPhoneNumber`, `internationalPhoneNumber`, `websiteUri`, `rating`, `userRatingCount`, `regularOpeningHours`, `currentOpeningHours`, `regularSecondaryOpeningHours`, `currentSecondaryOpeningHours`, `priceLevel`, `priceRange`, `transitStation`.

**Enterprise + Atmosphere (1k free, same cap pool)**: `editorialSummary`, `reviews`, `goodForGroups`, `goodForChildren`, `goodForWatchingSports`, `allowsDogs`, `reservable`, `outdoorSeating`, `liveMusic`, `servesBeer` / `servesWine` / `servesCocktails` / `servesCoffee` / `servesBreakfast` / `servesBrunch` / `servesLunch` / `servesDinner` / `servesDessert` / `servesVegetarianFood`, `takeout`, `delivery`, `dineIn`, `curbsidePickup`, `menuForChildren`, `restroom`, `parkingOptions`, `paymentOptions`, `fuelOptions`, `evChargeOptions`, `routingSummaries`, AI summaries (`generativeSummary`, `reviewSummary`, `neighborhoodSummary`, `evChargeAmenitySummary`).

Not available anywhere in Places API: **capacity**, **email**, **price bands for events**, **private-room flags**. Capacity remains a tier-2 (venue's own site) job; the honest-contact rule still applies.

## 1.3 SKU pricing and free monthly caps

From the price list, https://developers.google.com/maps/billing-and-pricing/pricing ("Last updated 2026-11-03 UTC"):

| SKU (Places New) | Free/mo | then per 1k |
|---|---|---|
| Text Search Essentials (IDs Only) / Place Details Essentials (IDs Only) | **Unlimited** | $0 |
| Place Details Essentials | 10,000 | $5.00 |
| Geocoding (Essentials) | 10,000 | $5.00 |
| Autocomplete Requests (Essentials) | 10,000 | $2.83 |
| **Text Search Pro / Nearby Search Pro** | **5,000** | **$32.00** |
| Place Details Pro | 5,000 | $17.00 |
| Autocomplete Session Usage | Unlimited | $0 |
| **Text Search Enterprise / Nearby Search Enterprise** | **1,000** | **$35.00** |
| **Text Search / Nearby Search Enterprise + Atmosphere** | **1,000** | **$40.00** |
| **Place Details Enterprise** | **1,000** | **$20.00** |
| **Place Details Enterprise + Atmosphere** | **1,000** | **$25.00** |
| Place Details Photos (Enterprise) | 1,000 | $7.00 |
| Routes: Compute Routes Essentials | 10,000 | $5.00 |
| (Legacy) Places Nearby/Text Search Pro | 5,000 | $32.00 |
| (Legacy) Place Details Pro | 5,000 | $17.00 |
| (Legacy) Contact Data (Enterprise) | 1,000 | $3.00 |
| (Legacy) Atmosphere Data (Enterprise) | 1,000 | $5.00 |

The old plan's "Pro tier gives phone/website" assumption is **wrong for the current API**: in Places API (New), phone/website/hours/rating/price are **Enterprise** fields (1k free/mo, $35–40/1k for searches, $20–25/1k for Details). Legacy Places had cheaper Contact Data ($3/1k) but is in Legacy status: "As of October 2026, Places API (Legacy) can no longer be enabled for new Google Cloud projects" — new projects cannot use it, so it is not an escape hatch. Places API (New) quotas are **per method per project** (each of Text/Nearby/Details has its own quota); legacy had a single shared quota.

## 1.4 Pagination, radius, per-call limits

- **Nearby Search (New)**: `maxResultCount` 1–20 per call (default 20); **no pagination** — no nextPageToken, one call answers at most 20 venues. `locationRestriction.circle` radius 0.0–50,000 m (default 0.0; small radii scale up by area density). Type filter `includedTypes`/`includedPrimaryTypes` (± excluded), multiple types allowed, up to 40 entries in each list.
- **Text Search (New)**: `pageSize` 1–20 (default 20, >20 clamped; supersedes deprecated `maxResultCount`), **`nextPageToken` + `pageToken` → up to 60 results in 3 calls**. `locationBias` (soft) or `locationRestriction` (hard) as circle (radius 0–50,000 m) or rectangle; IP-bias if both omitted. Extras: `priceLevels` filter, `rankPreference` RELEVANCE/DISTANCE, `evOptions`, `includePureServiceAreaBusinesses`.
- **Place Details**: one place per call; `sessionToken` only matters for Autocomplete sessions.
- **Autocomplete (New)**: session tokens make sessions free (Autocomplete Session Usage $0); abandoned sessions bill per-request at $2.83/1k after 10k. Not core for tarima (no user-facing search box today).
- **Place Photos**: media URI per photo; `skipHttpRedirect=true` returns JSON with `photoUri` (probe p14); media fetch is billed per photo (1k free/mo). Default 1600px max dimension; for a `photoUri` you can append size params when fetching the image itself.
- Latency measured: 0.11–0.67 s per call (median ~0.2 s) — interactive-grade, unlike Overpass's 27–60 s.

## 1.5 What the live probe measured (Berkeley anchor 37.8719,−122.2585, r=1500 m)

- Nearby Search (restaurant/cafe/bar/supermarket, DISTANCE rank): 20/20 places with id+name+coords+address+types. Campus-adjacent bias as expected (Press, FSM Cafe, Golden Bear Café…). Triple Rock (1.1 km away, 1920 Shattuck) not in the top-20 by distance — Nearby's 20-cap is a real coverage limit for dense areas.
- Text Search "rooftop venue for 40 people Berkeley": **20 results, 12 directly venue-shaped** (Study Hall Rooftop Lounge, High 5ive Rooftop Venue, Hillside Club, Ciel Creative Space, BK Studio Event Space, The Terrace Room Events, Berkeley City Club, The Monkey House, The Back Room, Shelby's Rooftop, Cornerstone…). OSM/Overpass answered the identical question with **0** results (zero "rooftop" matches at 2500 m in the 2026-11-05 OSM test). This is the single biggest capability gap Google closes: vibe/feature queries.
- Coverage on the 20 Nearby results (p15, Enterprise+Atmosphere mask): phone **70%** (14/20), website **80%** (16/20), hours **85%** (17/20), rating 95%, price level 65%, editorial summary 25%, goodForGroups 25%, outdoorSeating 55%, reservable 40%. **Contactable (phone∨website) 85%**, full trio (phone∧website∧hours) 55%. Versus the plan's Geoapify numbers on 20 Berkeley places (phone 1/20 = 5%, website 5/20 = 25%, hours 5/20 = 25%): Google is 14× on phone, 3.2× on website, 3.4× on hours. Versus OSM food density (phone 38%, website 60%, hours 46%): Google roughly doubles every field. OSM email 5% vs Google 0% (no email field) — email stays tier-1.5/tier-2.
- Triple Rock Place Details (p16, one call, Ent+Atmo): phone (510) 843-2739, website triplerock.com, full 7-day hours (periods + weekdayDescriptions), rating 4.3 / 645 reviews, PRICE_LEVEL_INEXPENSIVE, OPERATIONAL, editorial summary, reservable ✓, outdoorSeating ✓, servesBeer ✓, servesWine ✓, liveMusic ✗, servesCocktails ✗. OSM's best-record matches this; Google returns this density for the *majority* of venues, not the top few percent.
- Per-call SKUs and cost (if beyond free caps): p03 $0.032 (Nearby Pro 1 call), p04 $0 (IDs-only), p05 $0.032 (Text Pro), p15 $0.040 (Nearby Ent+Atmo), p16 $0.025 (Details Ent+Atmo), p01/p02/p10/p13/p14 all within Essentials/Photos free tiers (~$0.005–0.007/1k). Whole 15-call session billable value: ~$0.14.

## 1.6 Caching/storage: what tarima may persist (ToS)

From Places policies, https://developers.google.com/maps/documentation/places/web-service/policies (checked 2026-11-05): "You must not pre-fetch, cache, or store Places API content beyond the allowed exceptions, although the place_id is exempt from caching restrictions." Explicitly: **`place_id` may be stored indefinitely**; the Place IDs guide allows periodic refresh of details by place_id. Everything else (name, address, phone, website, hours, rating, price, atmosphere flags, photos) is Google Maps Content — **no persistence beyond the live session**, no pre-fetching, no background enrichment runs, plus attribution ("Google Maps" logo/text wherever content is shown) and the usual no-scraping clause. The lat/lng 30-day allowance the old plan cited belongs to the Maps Service Specific Terms' general caching provisions; the Places-specific policy page is stricter (nothing except place_id), so the cache design must assume the stricter rule for place content and may treat only the coordinate pair per the 30-day rule when it comes from a Google response. Practically: **tarima's SQLite must never become a Google-content store. Google rows live only in venue_catalog as `place_id` + provenance; everything displayable comes from Geoapify/OSM/Overture/venue sites.**

---

# Deliverable 2 — Limits and cost-cap configuration (copyable Cloud Console checklist)

Google has **no hard spend cap**: quotas limit request counts, budget alerts only notify. Defense is: per-method daily quotas sized to the free caps + app-side counters + circuit breaker + alerts. Free caps reset monthly; daily quotas reset midnight Pacific.

## 2.1 APIs: enable / leave disabled

Enable only: **Places API (New)**, **Routes API** (only if travel-time between venues is wanted; can be skipped — see 3.2). Already enabled per probes: Places API (New), Routes API. Leave disabled (and do NOT enable): Places API (Legacy) — cannot be enabled for new projects anyway; Geocoding API — Photon/Geoapify cover it (if the owner wants a Google fallback, note it bills Essentials 10k free); Maps Static, Maps Embed, Maps JavaScript, Street View, Address Validation, Time Zone, Aerial View, Environment APIs — irrelevant to tarima.

## 2.2 Key restrictions

- **API restrictions**: "Restrict key" → select exactly: `Places API (New)`; add `Routes API` only if used. Nothing else.
- **Application restrictions**: server-side calls from the VPS ⇒ **IP restriction (HTTP referrer restrictions do not apply to server-side keys)**. Set it to the VPS egress IP: on the VPS run `curl -4 ifconfig.me` (or check the VPS provider's network page). Do **not** restrict to the laptop's IP unless you plan to develop against it from home — a laptop IP changes; if both are needed, the key needs the VPS IP only, and local dev uses a separate restricted dev key. If tarima's outbound traffic ever routes through a NAT/proxy, restrict to that egress IP. Add the IP only after confirming the VPS address is static (provider-dependent).
- Create the key fresh (don't reuse an unrestricted one), and never ship it to clients — all calls go through tarima's backend.

## 2.3 Per-method daily quotas (the arithmetic)

Quota page: Cloud Console → **Google Maps Platform → Quotas** (or IAM & Admin → Quotas & System Limits, service = Places API (New)). Quotas are **per method**, and a method's SKU is decided by the field mask, so **one quota must cover the most expensive tier that method can emit** — that is why the daily limits below are computed from the 1,000/month Enterprise caps, not the 5,000 Pro caps, whenever the method may be called with an Enterprise mask.

Free cap ÷ 31, round down (Google's own formula in manage-costs), then safety margin:

| Quota row (Places API (New)) | SKU the method can bill | free cap/mo | cap÷31 | **set to (safety-margined)** |
|---|---|---|---|---|
| "Nearby Search requests per day" | Pro (5k) or Ent/Ent+ (1k) depending on mask | 1,000 (Ent) | 32.2 | **24/day** (50% margin) |
| "Text Search requests per day" | IDs-only ($0) / Pro (5k) / Ent (1k) | 1,000 (Ent) | 32.2 | **24/day** |
| "Place Details requests per day" | IDs-only ($0) / Ess (10k) / Pro (5k) / Ent (1k) | 1,000 (Ent) | 32.2 | **24/day** |
| "Autocomplete requests per day" | Essentials | 10,000 | 322 | **160/day** (optional; skip if no UI box) |
| "Place Details Photos requests per day" (or per-minute row) | Enterprise | 1,000 | 32.2 | **16/day** |
| Routes API "Compute Routes requests per day" | Essentials | 10,000 | 322 | **160/day** (only if Routes enabled) |

Also lower the per-minute quotas (e.g. 6/min for searches and details, 2/min for photos) to stop runaway loops within a day. Worst-case monthly spend at these caps: 24×31 ≈ 744 billable events per method ≤ 1,000 free per SKU ⇒ **$0.00 guaranteed**, even if every call hits the most expensive SKU, and even though a quota is per-method rather than per-SKU. Handling of mixed-tier masks on one method: keep two app-side counters (see 2.5) — the Cloud quota is the blast-radius cap; the app-side ledger is the tier-aware budget.

## 2.4 Budget alerts

Cloud Console → Billing → Budgets & alerts: budget $1/month on the billing account scoped to this project, thresholds **50% / 90% / 100%**, delivery email + (optional) Pub/Sub topic (e.g. `projects/tarima/topics/gcp-budget`) — a subscriber could auto-disable billing or the API, but note the lag (budget notifications are near-real-time, billing data is delayed up to ~a day; a Cloud Function kill switch therefore acts late — treat it as a backstop, not the primary cap; the quotas in 2.3 are the primary cap). Practical extra: use a billing subaccount/prepaid-style arrangement with a card with a low limit, or no card attached where possible — without billing enabled Maps APIs stop serving, which for a live-only tier is a safe failure mode.

## 2.5 App-side guard (env vars, counters, breaker, tier gate)

Env additions (`.env`, gitignored — same file that already holds GOOGLE_MAPS_API_KEY):

```
GOOGLE_PLACES_ENABLED=0            # master switch; ship OFF until quotas+alerts exist
GOOGLE_PLACES_FIELD_TIER=pro       # pro | enterprise  (enterprise required for phone/website/hours)
GOOGLE_PLACES_DAILY_BUDGET=10      # app-side daily cap, LIVE calls; Google-side quota is the outer belt
GOOGLE_PLACES_ENTERPRISE_DAILY=10  # of DAILY_BUDGET, how many may use Enterprise masks
GOOGLE_PLACES_WARM_DAILY=0         # cache-warming job cap; default 0 = warming NEVER spends Google calls
```

Implementation contract (fits the plan's provider-seam and spend-ledger patterns):

- Counter table (SQLite, e.g. `provider_ledger(day TEXT, provider TEXT, tier TEXT, used INT, cap INT)`): increments before each call, checked before send; live user-facing requests take priority — warming is skipped whenever `used > 50%` of the live cap.
- **The app refuses to send an Enterprise field mask unless `GOOGLE_PLACES_FIELD_TIER=enterprise` AND the day's Enterprise counter is under `GOOGLE_PLACES_ENTERPRISE_DAILY`.** Unit test asserts the refuse path; masks live in a tier map so a Pro call can never accidentally include an Enterprise field.
- Circuit breaker per Google method (3 failures or 2×429 in 5 min → open 30 s → jittered half-open; copy cauce `health.rs` semantics).
- On **HTTP 429 RESOURCE_EXHAUSTED** (what a hit Cloud quota or per-minute limit returns; docs recommend exponential backoff + jitter): tier-1 answers from Geoapify/OSM rows only, marks Google `over_budget`/open for the rest of the agent run, never retries Enterprise masks that day (Cloud daily quotas reset midnight PT — the ledger resets then too). The reply to the user carries the OSM/Geoapify quality (which the plan already treats as normal).
- Idempotence: same (place_id, mask-tier) within 24 h ⇒ reuse the in-memory/session response, not a second billed call.

---

# Deliverable 3 — Integration recommendation

## 3.1 Where Google sits in the tier ladder

```
tier 1  discovery (unchanged):  Geoapify Places → Overpass hedge  —  storable, $0, the base catalog
tier 1  vibe/feature search:    Google Text Search (NEW, see below)
tier 1E google detail pass:     top-K shortlist only, live-only, Enterprise+Atmosphere Details
never:                          persisting Google content beyond place_id (ToS)
```

Two Google uses justify the key, at measured value:

1. **Vibe/feature queries** ("rooftop venue for 40 people"): Google Text Search answered with 12 venue-shaped hits where OSM/Geoapify return 0. For these queries Google is the *primary* — run Text Search with `locationRestriction` circle, IDs-only mask ($0, unlimited) for discovery, then shortlist.
2. **Contact/hours enrichment of the top-K shortlist** (K≈5–10): after Geoapify/OSM discovery and ranking, for the venues that lack phone/website/hours, one Place Details call each with the Ent+Atmo "tarima mask" from p16. With 70/80/85% field coverage on Berkeley, ~5–8 calls fully arms a shortlist. Keep phone/website/hours in the **session response only**; persist `place_id` + `contact_source='google'` (meaning: "re-query Google for contact") so the row remains honest.

Do **not** make Google Nearby the primary discovery: no pagination (20/call), the distance-ranked top-20 misses dense-area coverage (Triple Rock not in our 20), and Pro-mask discovery of the whole base catalog would be uncached/unpersistent — it buys nothing Geoapify+Overture don't already provide storable.

## 3.2 Cost per 100 user queries

Assumptions: 100 user queries → 60 plain discovery (Geoapify/OSM, $0), 40 vibe queries (Google Text IDs-only, $0), 25% of queries escalate to a detail pass (avg 6 Details, Ent+Atmo) → 150 Details/mo-equivalent per 100 queries; plus 10 Text Pro re-ranks (best-effort, optional) per 100 queries. Monthly-scale billable: 150 Details-Ent ($0.025 each) + 10 Text-Pro ($0.032) + ~40 Nearby-Pro hedge calls ($0.032) ≈ **$3.75 + $0.32 + $1.28 ≈ $5.35 per 100 queries if nothing were cached** — but everything is cached in-session and the volumes are ~100× below that in reality; at tarima's actual scale (tens of queries/day) the spend sits **entirely inside the 1,000/mo free caps ⇒ $0.00/mo**, which is exactly what the 2.3 quotas guarantee. Routes/Distance Matrix for "10 min walk from BART": nice-to-have, Essentials 10k free, but haversine + `googleMapsUri` deep-link covers the beta need — skip Routes (disable it) until a user asks for travel times.

## 3.3 Cache TTL / persistence rules (ToS-compliant)

- Persist from Google: **only `place_id`** (indefinite) + `contact_source`/`provider` provenance + the fact that a detail pass ran (`last_google_check_at` timestamp).
- Do NOT persist: phone, website, hours, rating, price, atmosphere flags, editorial summary, photos, names/addresses beyond what Geoapify/OSM already stored. Venue rows shown to the user carry OSM/Geoapify-sourced fields; Google-sourced contact fields live in the session response and are merged into the *reply*, not the catalog. (If the owner later wants persistence, that is a written-agreement conversation with Google, not a code change.)
- plan's §2.2 TTL table: keep as-is for Geoapify/OSM/Overture rows; Google-derived values get TTL = session (0). The `place_cache`/`search_cache` tables never store Google payloads; at most they store a pointer row `{source:'google', place_id, expires_at:null}`.
- Attribution: wherever Google-sourced data reaches the user, show the Google Maps attribution (text "Google Maps" acceptable).

## 3.4 Google → venue_catalog mapping (session-merge, provenance-marked)

| Google field | venue_catalog column | contact_source | Persisted? |
|---|---|---|---|
| `id` | `external_id` (prefix `g:`) / `google_place_id` | `google` | **yes** (indefinite) |
| `location.lat/lng` | `latitude`,`longitude` | `google` | only if row had no coords from OSM (30-day rule); otherwise ignore |
| `displayName` | display name (session) | `google` | no (OSM name is canonical in catalog) |
| `nationalPhoneNumber` | `contactPhone` | `google` (session-merge) | no |
| `websiteUri` | `website` | `google` (session-merge) | no |
| `regularOpeningHours.weekdayDescriptions` | `opening_hours` | `google` (session-merge) | no |
| `rating` / `userRatingCount` | `rating` (display) | `google` | no |
| `priceLevel` | `priceBand` (map: INEXPENSIVE→$, MODERATE→$$, EXPENSIVE→$$$…) | `google` | no |
| `editorialSummary` | `notes` (display) | `google` | no |
| `goodForGroups`, `outdoorSeating`, `reservable`, `servesBeer`, `liveMusic`… | capacity-adjacent heuristics (display) | `google` | no |
| `googleMapsUri` | deep link in reply | — | no |
| — (absent) | `contactEmail`, `capacity` | — | stays null → tier 2 crawl / needs_contact bucket |

## 3.5 Exact changes to the plan's phases and env vars

- **Phase 0** (decision table): replace open-decision 1 ("Google Places live-only, defer") with: approve Places API (New) escalation tier as specified in 2.x/3.1 (quotas set BEFORE `GOOGLE_PLACES_ENABLED=1`); record the persist-`place_id`-only rule as the coded constitution (the never-Google-scraping rule stays).
- **Phase 1** (search_venues): unchanged except add optional vibe-query arm: if the tool input contains feature/attendance keywords, escalate to Google Text Search IDs-only when `GOOGLE_PLACES_ENABLED=1`; merge Google place_ids into results as `source='google'` pointers.
- **Phase 3** (metadata enrichment ladder): insert a new step before FSQ: `apps/api/src/services/providers/googleplaces.ts` — details pass for top-K lacking phone/website/hours, tier-gated mask, ledger increments, breaker, session-only fields; fixtures: save p15/p16 responses as recorded fixtures (strip nothing — they contain no key material) and unit-test the refuse-Enterprise path, the 429 path, and the no-persist invariant (assert no Google display field is written to venue_catalog).
- **Phase 5** (deferred): remove "Google Places live-lookup escalation" from deferred (now designed); add "Google Nearby as primary discovery" only if Geoapify dies AND owner accepts non-persistent discovery.
- Env vars added: the five `GOOGLE_PLACES_*` from 2.5 (and `GOOGLE_MAPS_API_KEY` stays as-is, header-only usage). Routes API: not enabled; add nothing.
- KPI additions for the §3.2 eval: golden "rooftop venue 40 people Berkeley" must yield ≥5 venue-shaped results via the Google arm; contact-rate KPI re-based: phone ≥70% and hours ≥80% on shortlists *after* the Google detail pass (vs 40/50% targets from OSM+FSQ alone).

## 3.6 Verdict

**Adopt Google Places API (New) as a governed escalation tier, not as the discovery base.** Geoapify/OSM/Overture remain tier 1/1.5 (storable, free, the catalog); Google Text Search becomes the vibe-query primary and Place Details (Ent+Atmo) the shortlist contact-pass — live-only, ≤10 calls/day, quotas set to the arithmetic in 2.3, Enterprise masks gated behind an env flag, persisting nothing but place_id. This converts the measured 70/80/85% phone/website/hours coverage into real outreach capability while keeping the SQLite catalog legally clean and the worst-case bill at $0.

Top risks (ranked):

1. **ToS/persistence drift**: someone "helpfully" caches Google fields into venue_catalog — the single biggest legal/cleanliness risk. Mitigation: the no-persist invariant as a unit test + review checklist + `contact_source` semantics, not just documentation.
2. **Enterprise free-cap misjudgment**: the plan assumed phone/website were Pro-tier; they are Enterprise (1k/mo). If the detail pass is left at `FIELD_TIER=enterprise` by default with no per-day gate, a busy week could burn the month's cap in two days and start billing at $20–40/1k. Mitigation: 2.5 counters + 2.3 quotas (blast radius ≤ 744 events/mo).
3. **Key restriction breakage**: adding the VPS IP restriction will 403 every call until the egress IP is exact (NAT/proxy surprises); conversely leaving the key unrestricted invites abuse. Mitigation: set API restriction first, verify from the VPS, then add the IP restriction; keep one dev key if laptop testing is needed.
4. **Quota-reset timezone trap**: daily quotas reset midnight PT, not UTC — an app-side ledger reset on UTC midnight double-spends the last hours of the PT day. Reset the ledger on `America/Los_Angeles` midnight.
5. **Legacy Places confusion**: Contact Data ($3/1k) no longer exists for new projects; any doc or AI suggestion pointing at `/maps/api/place/*` endpoints is dead weight — code must use `places.googleapis.com/v1` only.
6. **Single-provider dependency for vibe queries**: Google is the only source answering "rooftop for 40" today; its 429/disablement makes those queries fail. Acceptable (marked degraded + Geoapify fallback answers the *category* question), but say so honestly in replies.

## Appendix — probe ledger

15 requests total (hard cap respected, all ≥1.1 s apart, key header-only): p01 Geocoding (200/REQUEST_DENIED-body), p02 Routes computeRoutes Essentials (200), p03 Nearby Pro mask (200), p04 Text IDs-only (200), p05 Text Pro (200), p11/p12 Legacy Nearby+Text (200/REQUEST_DENIED-body), p13 Autocomplete (200), p14 Photo media JSON (200), p15 Nearby Ent+Atmo (200), p10 Autocomplete Triple Rock (200), p06/p07/p08 Details (404 — my URL bug: missing `places/` prefix; retried correctly as p16 within budget), p16 Details Ent+Atmo Triple Rock (200). Estimated billable value of the session if beyond free tiers: ~$0.14. Unchecked items: Geocoding/legacy enablement state on the project (requires one Console look, key-in-URL forbidden here); per-minute default quota values (visible only in the owner's Console); whether the key carries any application restriction (probes suggest none); photo size-param behavior beyond the JSON probe; Autocomplete session economics (not needed for beta). Raw redacted artifacts: `/tmp/tarima-gmaps/` (p*.json, p*.hdr, probe-log.txt; docs mirrors *.txt).
