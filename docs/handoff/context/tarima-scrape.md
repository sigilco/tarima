# Tarima discovery addendum: place-metadata enrichment from Google Maps / DuckDuckGo - feasibility, spike, recommendation

Date: 2026-11-05 (session 14:30-15:35 PST). Author: Maki (research/spike, repo read-only, no commits, no sign-ups, no API keys).
Parent document: `/tmp/tarima-search-plan.md` (read in full; §1.3 scraping tier, §1.4 tier ladder, OSM test results).
Scratch evidence: `/tmp/tarima-scrape/` (`raw/*.html` + `raw/*.headers`, `robots/*.txt`, `parser/extract_tbmmap.py`, `fetch_summary.txt`, `fetch.log`).
Milestones: `/tmp/tarima-scrape.status`.

Owner premise: the Geoapify live test over 20 Berkeley food places returned phone for 1/20, website 5/20, opening_hours 5/20. The earlier plan said "never Google". This document does not assume that verdict; it re-derives it from the law, the terms, and a live spike, and gives the owner a safe design if the answer is "yes, behind a flag".

---

# 0. Bottom line for the owner (read this first)

1. **DuckDuckGo is a dead end for place metadata, and it is not even reachable with plain HTTP.** The first request to `html.duckduckgo.com/html/?q=...` from a generic identifying UA returned **HTTP 202 with a "select all squares containing a duck" image captcha**. Same for `lite.duckduckgo.com`. Per the spike rules I stopped the source there. DDG's ToS contains **no** scraping clause, but its robots.txt at `duckduckgo.com` disallows `/lite`, `/html` and query strings, and its own Instant Answers API explicitly disclaimed full search-result syndication. DDG Maps is a JS app (Apple/MapKit-backed) with **no** server-rendered place data and no `maps.duckduckgo.com` DNS record. **Verdict: do not use, for metadata or for search.**
2. **Google Maps place pages and `/maps/search/` are JS shells over plain HTTP.** A 200 response is 66 KB of compressed boilerplate whose `APP_INITIALIZATION_STATE` (32-37 KB) contains the query echo, a viewport and a tile-vector blob - **zero** place metadata, no phone, no hours, no website, no rating. No captcha was served (the UA was not challenged), but there is no data either. Reaching the data needs a JS-capable browser (Playwright), i.e. 300-800 MB RSS on the VPS.
3. **One undocumented endpoint did deliver the richest payload of the whole session: `https://www.google.com/search?tbm=map&q=...`.** It is a plain-HTTP JSON response (17.9 KB decompressed) and it carried, for Triple Rock: `place_id` (ChIJ...), E.164 phone, website, weekly opening hours with holiday overrides, rating 4.3/645 reviews, categories, timezone, the Google Reserve dining URL, accessibility attributes, and lat/lng. **This is the whole Google Maps dataset in one plain GET.** It is also robots-allowed, unchallenged, and its structure is positional (undocumented, no schema, shifts between payloads) - and it returned an **empty** payload for the second query in the same spike.
4. **The legal position is not ambiguous.** Google Maps Platform ToS §3.2.3(a) "No Scraping" and §3.2.3(b) "No Caching" apply to Google Maps Content. Using the Places API key (which the compliant substitute requires) *is* accepting those terms. So the question "can we scrape Google Maps?" and the question "should we take a Places API key?" are the same contract, and the answer to both is governed by §3.2.3.
5. **The realistic consequences for a small self-hosted app are technical, not legal, in the short run**: IP-level blocks and captcha walls on a residential/VPS IP, with no notice, no takedown, no lawyer, no fine. The serious risk is the **contract** one: a Google Maps API account that has accepted §3.2.3 and also scrapes Google Maps exposes the *account* (and therefore the Places API key and the payment method) to termination, not just the scraper. So the honest design is not "scrape with a key" and "scrape without a key" as two tiers; it is one tier where **the key and the scraper never coexist**.
6. **Recommendation: build tier 2b for the venue's own website first (compliant, highest value per unit of risk), Google Places API (New) free tier for shortlist hours/phone, and keep `tbm=map` behind a default-off flag as an explicitly-accepted legal risk - with the cauce `ddgs` engine fixed or removed before any DDG work continues.** Ranked verdicts in §3.

---

# Deliverable 1 - Feasibility and risk matrix

## 1.0 Facts established by the spike (primary evidence, all 2026-11-05)

| Source | Path fetched | robots.txt verdict | HTTP result | What came back |
|---|---|---|---|---|
| DuckDuckGo HTML | `html.duckduckgo.com/html/?q=Triple+Rock+Brewery+Berkeley` | **Allowed** (`Allow: /` for `*`) | **202**, 14,266 b, 0.22 s | "Unfortunately, bots use DuckDuckGo too. Please complete the following challenge to confirm this search was made by a human. **Select all squares containing a duck**" (67 `anomaly` refs, 13 `challenge` refs) |
| DuckDuckGo Lite | `lite.duckduckgo.com/lite/?q=...` | **Allowed** (`Allow: /`) | **202**, 14,272 b, 0.19 s | Identical duck captcha; code `ec9a` to email `error-lite+ec9a@duckduckgo.com` |
| DuckDuckGo JS site | `duckduckgo.com/?q=...&ia=web` | Allowed at root | **202**, 22,660 b | No `vqd` token, no results; shell says "You are being redirected to the non-JavaScript site" |
| DuckDuckGo Maps | `maps.duckduckgo.com/?q=...` | n/a | **DNS NXDOMAIN** | Host does not exist. DDG Maps is `duckduckgo.com/?iaxm=maps` (JS app); `/local?q=...` 302s into `duckduckgo.com/?q=local&q=...&rpl=1` |
| Google Maps search | `www.google.com/maps/search/Triple+Rock+Brewery+Berkeley?hl=en` | **Allowed** (`Allow: /maps/search/`) | 200, 219,413 b decompressed, 0.29 s | HTML shell + `APP_INITIALIZATION_STATE` 36,911 chars: query echo, viewport, tile vector blob. No phone/hours/website/rating |
| Google Maps place page | `www.google.com/maps/place/Triple+Rock+Brewery/@37.876205,-122.260914,17z` | **Allowed** (`Allow: /maps/place/`) | 200, 219,412 b decompressed, 0.28 s | Same shell, AIS 32,752 chars. No place payload |
| **Google `tbm=map`** | `www.google.com/search?tbm=map&q=Triple+Rock+Brewery+Berkeley&hl=en` | **Allowed** (`Allow: /search?*tbm=map`) | 200, **17,918 b decompressed**, 0.45 s | **JSON** (`)]}'` prefix) with full place record (see below) |
| Google `tbm=map` (2nd query) | `...&q=Ace+Martial+Arts+Studio+Berkeley` | Allowed | 200, 4,945 b decompressed | **Empty** - query echoed, no place item, **no block page**. Silent no-data |
| Google Maps place URL (2nd query) | `www.google.com/maps/place/Ace+Martial+Arts+Studio/@37.8692078,...` | Allowed | 200, 219,578 b | Same JS shell |
| Bing | `www.bing.com/search?q=...&format=rss` | **Disallowed** for `*` (`Disallow: /search`) | 200, 5,299 b | RSS with 10 items, but US-locale junk (Utah ads) for a Berkeley query; explicit non-commercial copyright clause. **This fetch was a robots violation on my part - logged, not repeated** |

Anti-bot observations, stated plainly: **DuckDuckGo captcha'd on the very first plain-HTTP request from a generic UA; Google did not captcha or block any of the three paths I fetched, and served real data on `tbm=map`.** No proxy, rotating IP, stealth plugin, fingerprint spoofing or captcha solving was used, per the rules. The Google result is therefore evidence for a *low-rate, plain-HTTP, robots-allowed* fetcher - it is **not** evidence that a headless browser at scale would survive.

## 1.1 The `tbm=map` payload - what is actually extractable

Parser sketch: `/tmp/tarima-scrape/parser/extract_tbmmap.py` (runs on the saved raw file; it is a **positional** sketch, see brittleness below). Output for the Triple Rock query:

```json
{
 "query": "Triple Rock Brewery Berkeley",
 "place_id": "ChIJB9VFu51-hYAR5jAQDlKAoMA",
 "kg_id": "0x80857e9dbb45d507:0xc0a080520e1030e6",
 "name": "Triple Rock Brewing",
 "address": ["1920 Shattuck Ave.", "Berkeley, CA 94704"],
 "lat": 37.873416, "lng": -122.2687553,
 "rating": 4.3, "review_count": 645,
 "website": "http://triplerock.com/",
 "phone": "(510) 843-2739", "phone_e164": "+15108432739",
 "categories": ["Brewpub","Brewery","Pub","Restaurant"],
 "neighborhood": "Downtown Berkeley",
 "tz": "America/Los_Angeles",
 "hours_week": [["Thursday","11:45 AM-11 PM",[[11,45],[23]]], ["Friday","11:45 AM-11 PM",[[11,45],[23]]],
                ["Saturday","11:45 AM-11 PM",[[11,45],[23]]], ["Sunday","11:45 AM-9 PM",[[11,45],[21]]],
                ["Monday","4-10 PM",[[16],[22]]], ["Tuesday","11:45 AM-10 PM",[[11,45],[22]]],
                ["Wednesday","11:45 AM-11 PM",[[11,45],[23]]]],
 "hours_special_notes": ["Veterans Day might affect these hours"],
 "reservable_via": "https://www.google.com/maps/reserve/v/dine/c/UHdr03yNkmk?source=pa&opi=79508299",
 "accessibility": ["Wheelchair accessible entrance", "Wheelchair accessible restroom"],
 "place_url": "https://www.google.com/maps/preview/place/Triple+Rock+Brewing,+1920+Shattuck+Ave.,+Berkeley,+CA+94704/@37.873416,-122.2687553,..."
}
```

Field-by-field against the owner's wish list:

| Wanted field | `tbm=map`? | Note |
|---|---|---|
| opening hours | **Yes** - full weekly grid, structured (open/close as [h,m] pairs), plus holiday/exception notes | Best single value in the payload |
| phone | **Yes** - display + E.164 + `tel:` URI | |
| website | **Yes** - absolute URL + display host | |
| rating | **Yes** - value + review count | |
| price level | **No** (not present in the payload) | |
| popular times | **No** (no hourly busyness histogram in the payload) | |
| "good for groups" | **No** (the `accessibility` group is wheelchair-related only) | |
| capacity | **No** | Nothing in the payload carries capacity |
| email | **No** - no email field exists anywhere in the payload | Google has no email for venues, so no source can fix this except the venue's own site |
| place_id | **Yes** - `ChIJB9VFu51-hYAR5jAQDlKAoMA` | Same id the Places API returns, so results are joinable across the compliant and the scraped path |

Important cross-check: the phone `+1 510-843-2739` extracted from `tbm=map` is **the same phone OSM already had** for Triple Rock (node 282601069, per the parent's OSM test). So for venues OSM knows well, Google adds little; the value shows up on the OSM-poor majority, which is exactly the 1/20 Geoapify result the owner measured.

## 1.2 Per-source matrix

Legend: **access** = access method; **footprint** = cost on the 6-core/11 GB VPS (tarima + cauce + Litestream already resident).

### A. Google Maps via `search?tbm=map` (undocumented, robots-allowed)

| Dimension | Assessment |
|---|---|
| Metadata reachable | hours (structured, weekly + holiday notes), phone (E.164), website, rating + review count, categories, neighborhood, lat/lng, tz, place_id, reserve/dining URL, accessibility attributes. **Not** price level, popular times, good-for-groups, capacity, email |
| Access method | **Plain HTTP GET**, JSON body after a `)]}'` prefix. No browser, no JS, no token. 0.45 s, 17.9 KB |
| Brittleness | **High and structural.** The schema is undocumented and **positional**: the place record lived at `data[0][1][0][14]`; phone was at `item[178]` in one payload and `item[177]` in the parent's older reading; the accessibility group sits at `item[100]` but nests one level deeper than expected. Google ships no schema, so any index change silently yields `null` fields rather than an error. Also **query-dependent**: query 2 returned an empty payload with no error. Mitigations: assert on `place_id` presence (not on index numbers), snapshot-compare fields on every fetch, and treat a missing expected field as "source degraded", never as "the venue has no phone" |
| Anti-bot observed | **None.** No captcha, no 429, no consent wall, no challenge on any of the 3 Google paths fetched. `www.google.com` robots.txt explicitly allows `/search?*tbm=map`, `/maps/search/`, `/maps/place/`, `/maps?q=`; `maps.google.com` serves a byte-identical robots file (verified by diff) |
| Rate limits | Undocumented. Observed: 4 requests, no throttling. Realistic assumption: this endpoint is not a supported API and carries no published limit; the risk is an unannounced block, not a 429 |
| ToS / legal | **Directly contrary to Google Maps Platform ToS §3.2.3(a) No Scraping** (quote in §1.3). Also §3.2.3(b) No Caching, which bans storing anything but `place_id` (indefinite) and lat/lng (30 days). Practical effect: hours/phone/website/rating extracted this way **may not be written to the tarima database**, which is the entire point of a discovery layer |
| Data quality | High and fresh (Triple Rock hours showed a Veterans Day override the OSM record lacked). Latitude 37.873416 vs Google's own place URL 37.873416 - self-consistent. Risk: hours shown are the "current" week, and the payload includes a date; parse the date, not just the strings |
| Cost / footprint | **~0**: one `fetch`, no browser, no extra dependency, ~18 KB per response. Fits the VPS trivially |
| Verdict | **Use behind a flag, as an emergency/shortlist fallback only.** Highest value-per-request of anything tested; unacceptable as a primary source because of §3.2.3 |

### B. Google Maps place pages and `/maps/search/` (rendered UI)

| Dimension | Assessment |
|---|---|
| Metadata reachable | **Nothing, over plain HTTP.** Both responses are JS shells; `APP_INITIALIZATION_STATE` holds the query echo, a viewport and a tile-vector blob. The place payload is fetched later by XHR from internal endpoints that are themselves undocumented and `robots.txt`-guarded (`Disallow: /maps/api/js/`) |
| Access method | **Headless browser required** (Playwright/Crawlee): 300-800 MB RSS each, 300-800 MB of Chromium per browser plus system deps, on a 6-core/11 GB box already running tarima + cauce + Litestream. Would need a dedicated worker, not a request path. Plus: Google Maps is the single hardest anti-bot target on the web (consent walls, JS challenges, IP reputation, layout churn) |
| Brittleness | Extreme. Playwright breakages track Chrome releases; Google's consent interstitial changes independently; every selector is unstable |
| Anti-bot observed | None at the HTTP layer for a single plain GET. With a browser at any volume, expect the "Before you continue" consent wall and JS challenges, then IP reputation decay |
| Rate limits | Undocumented and enforced by reputation, not headers |
| ToS / legal | Same §3.2.3(a)/(b) as A, plus Google general ToS "using automated means to access content from any of our services in violation of the machine-readable instructions on our web pages (for example, robots.txt files ...)" |
| Data quality | Same underlying data as A, at 50-100x the cost and 100x the breakage |
| Cost / footprint | **Rejected on footprint.** The parent plan already rejected Playwright-class browsers for this reason; the spike confirms there is no plain-HTTP shortcut for place pages |
| Verdict | **Do not use.** Same legal exposure as A with none of A's efficiency |

### C. Google Search local pack / knowledge panel (`/search?q=`, no `tbm=map`)

| Dimension | Assessment |
|---|---|
| Metadata reachable | The local pack is rendered client-side; the knowledge panel for a venue carries hours/phone/rating in the page JS. `Disallow: /search` in `www.google.com/robots.txt` for `*` with no `Allow` carve-out for a plain query. **I did not fetch it** - robots forbids it |
| Access method | Headless browser |
| Brittleness / anti-bot | Highest of all - the local pack layout changes constantly; consent walls |
| ToS / legal | Robots-forbidden **and** §3.2.3; plus the general ToS automated-means clause |
| Verdict | **Do not use.** The one Google path I could not test is the one robots forbids. The robots-allowed sibling (`tbm=map`) already returns the same data |

### D. DuckDuckGo (html.duckduckgo.com, lite.duckduckgo.com, JS site, DDG Maps, vqd flow)

| Dimension | Assessment |
|---|---|
| Metadata reachable | **Nothing.** HTML and lite serve a captcha, not results. The JS site returns no `vqd` token and no results over plain HTTP. `maps.duckduckgo.com` does not resolve; `/local` 302s into the JS app; the Maps UI is Apple/MapKit-backed and renders client-side from a proprietary endpoint |
| Access method | For HTML/lite: would need a JS-capable browser to even clear the challenge, and the challenge is an **image-selection captcha** ("select all squares containing a duck"). Solving it requires captcha-solving services, which the spike rules forbid and which is the definition of adversarial evasion |
| Brittleness | N/A - never reached the data |
| Anti-bot observed | **Immediate captcha on the first request** (HTTP 202 + challenge page), on the two robots-allowed endpoints, with a generic UA and no evasion. This is a hard wall, not a rate limit |
| Rate limits | Not reached. DDG's public posture is that programmatic access should go through a paid partner API (the DuckDuckGo Search API); the old Instant Answers API explicitly said it "is not a full search results API or a way to get DuckDuckGo results into your applications" |
| ToS / legal | **Surprisingly permissive, and irrelevant because of the captcha.** DDG's ToS (last updated 2025-01-07) and Acceptable Use Policy contain **no** clause about scraping, robots, data mining, or building a competing database (verified full-text). The AUP prohibits unauthorized access, interference, and resale. DDG's own `duckduckgo.com/robots.txt` disallows `/lite`, `/html` and query strings - but `html.duckduckgo.com/robots.txt` and `lite.duckduckgo.com/robots.txt` both say `Allow: /`. So the two hosts you would actually scrape are robots-allowed, and the main host that documents the policy forbids them |
| Data quality | N/A |
| Cost / footprint | A browser to clear the captcha: 300-800 MB RSS, plus captcha-solving spend, plus a ToS problem of its own. Worst cost/benefit ratio of anything tested |
| Verdict | **Do not use.** Not because of law - because a captcha on request #1 means a permanent, escalating fight |

### E. Bing (comparison baseline)

| Dimension | Assessment |
|---|---|
| Metadata reachable | Ordinary web SERP only; the local-pack HTML is not available over the RSS endpoint. `format=rss` returned 10 items that did not honor the Berkeley query (Utah "Ace Hardware" results) - Bing's `mkt`/geo behaviour, which the cauce `bing.yaml` spec already handles by always sending `mkt` |
| Access method | Plain HTTP (RSS or HTML) |
| Brittleness | Moderate - cauce's declarative `bing` engine has 100% reliability over 6 live requests today, p95 345 ms |
| Anti-bot observed | None for the single fetch (and I should not have made it - see below) |
| Rate limits | Bing asks `mkt` to be sent always, else it geolocates by IP (verified live in cauce on 2026-09-22) |
| ToS / legal | `www.bing.com/robots.txt` **disallows `/search` for `*`** (the RSS variant answered anyway). Microsoft Services Agreement §3.a.vi: "Don't circumvent any restrictions on access to, usage, or availability of the Services (e.g., attempting to 'jailbreak' an AI system or **impermissible scraping**)"; §14.f.i: Bing materials "are for your **noncommercial, personal use only**", and other uses including "using these materials or products to build your own products" need Microsoft authorization. The RSS response carries its own in-band copyright: "These XML results may not be used, reproduced or transmitted in any manner or for any purpose other than rendering Bing results within an RSS aggregator for your **personal, non-commercial use**. Any other use of these results requires **express written permission from Microsoft Corporation**." Bing Search APIs were retired 2025-08-11 |
| Data quality | N/A for place metadata |
| Cost / footprint | ~0 |
| Verdict | **Do not add.** Bing adds no place-metadata capability over the existing cauce `bing`/`brave` engines, and its own terms are stricter for our use case than DDG's. Note the cauce `bing` engine already scrapes Bing - that posture is inherited from the existing system and is a separate, pre-existing risk, not something this tier would add |

### F. Compliant substitutes for the same fields

| Field wanted | Geoapify/OSM (tier 1, existing) | **Google Places API (New)** | Foursquare | Overture (tier 1.5) | Venue own site (tier 2) |
|---|---|---|---|---|---|
| opening hours | ~46% of food venues (measured) | `regularOpeningHours`, `currentOpeningHours` - **Enterprise tier** | `hours` - **Premium only** ($18.75 CPM, no free allowance) | **Not shipped** (announced as a future extension; the `hours` type applies only to transportation) | JSON-LD `openingHoursSpecification` - free, exact, business-published |
| phone | ~38% | `nationalPhoneNumber`/`internationalPhoneNumber` - **Enterprise** | `tel` - free Pro fields | `phones` - free, storable | `tel:`/`mailto:`/NAP - free |
| website | ~60% | `websiteUri` - **Enterprise** | `website` - free Pro fields | `websites` - free, storable | free |
| email | ~5% | **No field exists** | `email` - free Pro fields | `emails` - free, storable | `mailto:`/JSON-LD - free |
| rating | no | `rating` + `userRatingCount` - Enterprise | `rating` - **Premium** | no | rare |
| price level | no | `priceLevel`/`priceRange` - Enterprise | `price` - Premium | no | rare |
| popular times | no | **No data API.** Display-only via the Places UI Kit element `<gmp-place-popular-times>` (documented, Maps JS 3.66.13d, 2026-11-04); renders a histogram but does not expose it as storable data | `hours_popular` - Premium | no | no |
| good for groups | no | `goodForGroups` - **Enterprise + Atmosphere** | `attributes` - Premium | no | page text |
| capacity | ~0% | **No field** | **No** | announced, not shipped | regex over private-events page text - free |
| **storage rights** | cache/store/redistribute allowed (Geoapify FAQ; OSM ODbL) | **place_id indefinite; lat/lng 30 days; nothing else storable** | licensed output, internal caching normal | **store freely** (CDLA-Permissive-2.0 / Apache-2.0) | free |

**Google Places API (New) exact current numbers** (source: `developers.google.com/maps/billing-and-pricing/pricing`, "Last updated 2026-11-03"; cross-checked with `/pricing-categories`, and `places/web-service/data-fields` "Last updated 2026-11-03"):

| SKU | Free / month | Then |
|---|---|---|
| Text Search **Pro** (4FDA-34B1-A910) | **5,000** billable events | $32.00 / 1k |
| Nearby Search **Pro** (99F9-A108-83A6) | **5,000** | $32.00 / 1k |
| Place Details **Pro** (4ED6-464A-2AFC) | **5,000** | $17.00 / 1k |
| Place Details **Enterprise** (2D9A-3DE0-3766) | **1,000** | $20.00 / 1k |
| Place Details Enterprise + Atmosphere (EB23-5ECC-F753) | **1,000** | $25.00 / 1k |
| Text Search Enterprise / +Atmosphere | 1,000 | $35.00 / 1k (+Atmosphere $40) |
| Place Details **Essentials** (6E05-E1C3-8D85) | **10,000** | $5.00 / 1k |
| Text Search **Essentials (IDs only)** / Details Essentials (IDs only) | **Unlimited** | - |
| Places UI Kit Query (0678-4F72-DA7C) | 10,000 | $1.00 / 1k |
| Autocomplete Requests | 10,000 | $2.83 / 1k (session usage unlimited) |
| Legacy "Contact Data" SKU | 1,000 | $3.00 / 1k (legacy product only - **not** available in the New API) |

Field-mask SKUs, the part that matters for cost: in Places API (New) **contact and hours fields are Enterprise-tier, not Pro-tier**. A Details mask of `id,displayName,rating,regularOpeningHours,nationalPhoneNumber,websiteUri,userRatingCount,priceLevel` bills as **Place Details Enterprise = 1,000 free/mo, then $20/1k**. Adding `goodForGroups`, `curbsidePickup`, `dineIn`, `reservable`, `editorialSummary` moves it to **Enterprise + Atmosphere = 1,000 free/mo, then $25/1k**. There is **no separate Contact Data SKU** in the New API, and **Atmosphere is not a separate SKU** - it is a tier variant of the same SKU; billing takes the highest SKU the request's field mask touches ("You are then billed at the highest SKU applicable to your request").

The economics for tarima: 1,000 free Details-Enterprise calls/month covers a shortlist tier of roughly 30-50 enrichments per day. Beyond that, $20/1k = $0.02 per venue. For a self-hosted event-planner that enriches a *shortlist* (top-K venues per query) rather than a whole catalog, **the free tier alone is sufficient** and the scrape tier is not needed for the compliant path.

### G. Venue's own website via cauce (the compliant enrichment that should come first)

`cauce.fetch_and_index(url, query_hash?)` - MCP tool, live today at `search.localhost:4479`:

- What it gives: `{url, fetched_at, title, markdown, byte_len, source_query_hash}` - **markdown only**. No structured field column, no JSON-LD extraction, no raw-HTML return, so a tarima-side JSON-LD parser would need either a raw-HTML mode or the `LD+JSON` block to survive readability extraction (a real risk - readability strips `<script>`; this should be verified before relying on it)
- Guardrails already built in: SSRF egress guard (scheme allowlist, per-hop redirect validation, DNS-resolver guard refusing private/reserved answers, no DNS TOCTOU), 1 MB body cap (truncated, still indexed, `truncated=true`), 30 s whole-request timeout, per-host governor token bucket, capped redirects
- **Gap, confirmed by code reading: no robots.txt compliance** (`crates/cauce-core/src/archive/fetch.rs` has no robots logic; `crates/cauce-server/src/discovery.rs` serves *cauce's own* robots.txt, it does not consult a target's). The tarima-side robots check must stay, per the parent plan
- **Gap: the UA is a browser impersonation.** `crates/cauce-core/src/http.rs:56` `DEFAULT_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"`. Both the declarative engines and `fetch_and_index` use it. That is a mild fingerprint-spoofing posture, and it is the posture that would most likely get tarima's IP flagged by a venue's CDN. A tarima-identifying UA is both more honest and more robust
- Declarative engines are **GET-only** (`EngineSpec` has no method field) and support `url` template, `headers`, `timeout_ms`, `params`, `market`, `parse.kind: html|json`, `parse.results` CSS/JSONPath, per-field `css`/`attr`/`text`/`regex`/`path`, `detect.blocked` (substrings -> `Blocked`), `detect.rate_limited_status`, and `unwrap_redirect` rules. That is enough to host a DDG-HTML engine declaratively **if DDG ever served results** - it does not, and a captcha would need a `detect.blocked` marker plus a browser, which the declarative layer cannot provide

## 1.3 ToS / legal position, quoted

**Google Maps Platform Terms of Service** (https://developers.google.com/maps/terms, also byte-identical at https://cloud.google.com/maps-platform/terms; checked 2026-11-05), §3.2.3:

> "(a) **No Scraping.** Customer will not export, extract, or otherwise scrape Google Maps Content for use outside the Services. For example, Customer will not: (i) pre-fetch, index, store, reshare, or rehost Google Maps Content outside the services; (ii) bulk download Google Maps tiles, Street View images, geocodes, directions, distance matrix results, roads information, places information, elevation values, and time zone details; (iii) **copy and save business names, addresses, or user reviews**; or (iv) use Google Maps Content with text-to-speech services."

> "(b) **No Caching.** Customer will not cache Google Maps Content except as expressly permitted under the Maps Service Specific Terms."

> §3.2 context clause: "In this Section 3.2 (License Requirements and Restrictions), the phrase 'Customer will not' means 'Customer will not, and will not permit a third party to'."

> §20 Definitions: "'Google Maps Content' means any content provided through the Services (whether created by Google or its third-party licensors), including map and terrain data, imagery, traffic data, and places data (including business listings)."

**Maps Service Specific Terms** (https://cloud.google.com/maps-platform/terms/maps-service-terms, "Last modified October 28, 2026"), Part A §3 and §14.3:

> "**3. Google ID Caching.** Customer may cache the Google ID values from the Services that return such field and allow caching ... For example, Customer may cache (a) **place_id** from Places API ... "

> "**14.3 Caching.** Customer may temporarily cache **latitude and longitude** values from the Places API for **up to 30 consecutive calendar days**, after which Customer must delete the cached latitude and longitude values."

**Google General ToS** (https://policies.google.com/terms, "Effective July 30, 2026"):

> "...using automated means to access content from any of our services in violation of the machine-readable instructions on our web pages (for example, robots.txt files that disallow crawling, training, or other activities)"

> "Google may suspend or terminate your access to the services or delete your Google Account if any of these things happen: you materially or repeatedly breach these terms ... or your conduct causes harm or liability to a user, third party, or Google - for example, by hacking, phishing, harassing, spamming, misleading others, or **scraping content that doesn't belong to you**"

**Places API policies** (https://developers.google.com/maps/documentation/places/web-service/policies, "Last updated 2026-11-03"):

> "You must not pre-fetch, cache, or store Places API content beyond the allowed exceptions, although the **place_id is exempt** from caching restrictions." ... "You can therefore **store place ID values indefinitely**."

**DuckDuckGo ToS + AUP** (https://duckduckgo.com/terms, "Last updated: 01-07-2025"; https://duckduckgo.com/acceptable-use; checked 2026-11-05): **no clause about scraping, robots, automated access, data mining or competing databases exists in either document** (verified full-text). The AUP prohibits unauthorized access, interference, and resale: "Attempt to access, interfere with, or connect to the services and/or any computer without authorization"; "Interfere with or disrupt the integrity or performance of the services"; "Sell or resell any portion of the services". The historic Instant Answers API page (archived 2022-01-01) said: "it is not a full search results API or a way to get DuckDuckGo results into your applications ... we unfortunately do not have the rights to fully syndicate our results, free or paid." (Archived - the live page is offline.)

**Microsoft Services Agreement** (https://www.microsoft.com/en-us/servicesagreement, "Last updated: July 30, 2026"), §3.a.vi and §14.f.i:

> "vi. Don't circumvent any restrictions on access to, usage, or availability of the Services (e.g., attempting to 'jailbreak' an AI system or **impermissible scraping**)."

> "f. Bing and MSN. i. Bing and MSN Materials. The articles, text, photos, maps, videos, video players, and third-party material available on Bing and MSN ... are for your **noncommercial, personal use only**. Other uses, including downloading, copying, or redistributing these materials, or **using these materials or products to build your own products**, are permitted only to the extent specifically authorized by Microsoft or rights holders, or allowed by applicable copyright law."

And the in-band Bing RSS copyright (fetched 2026-11-05): "These XML results may not be used, reproduced or transmitted in any manner or for any purpose other than rendering Bing results within an RSS aggregator for your personal, non-commercial use. Any other use of these results requires express written permission from Microsoft Corporation."

### 1.4 The honest consequences, separated into three questions the owner actually asked

**(a) "Does scraping Google violate its ToS?"** Yes. If you touch Google Maps Content - place pages, the local pack, or `tbm=map` (its output *is* Google Maps Content, per the §20 definition: "places data (including business listings)") - without the Maps Platform services, you are outside the grant, and with the services you are bound by §3.2.3(a). Scraping `tbm=map` is exactly "(iii) copy and save business names, addresses" and is "export, extract, or otherwise scrape Google Maps Content for use outside the Services". The ToS is a contract; the breach is of the contract, not necessarily of a statute.

**(b) "What are the realistic consequences for a small self-hosted app: IP blocks/captchas vs legal?"** In the short run, **technical**. A VPS IP scraping Google at low rate will hit consent walls and JS challenges, then get rate-shaped into 429s, then into IP-level soft blocks, and eventually a hard datacenter-range block. There is no notice, no cease-and-desist for a single small self-hosted app, no plaintiff with standing, and no damages. The realistic worst case at our volume is **"Google stops answering us"** - which is a solvable engineering problem, not a legal one. The *legal* risk is not about scraping per se; it is about the **combination**: a Google account (the Places API key + billing) that has accepted §3.2.3 and also scrapes Google Maps is a contract breach by an *account holder*, and the remedy is account suspension plus loss of the key and the payment method - i.e. it puts the compliant tier at risk too. And it is worth remembering the litigation record the parent plan already cites (hiQ v LinkedIn, Meta v Bright Data, RyanAir v Booking, Lovly v Fox): the *data* is often usable under a CFAA-style theory; the durable risk is contract and trespass, plus the specific clause Google wrote for exactly this.

**(c) "What is the difference between storing/caching results and live lookup?"** Under §3.2.3(b) plus §14.3, **only `place_id` (indefinite) and lat/lng (30 days) may be stored**. Everything else - name, address, phone, website, rating, hours, price level - must be re-fetched and re-displayed within the same response lifecycle, i.e. **live lookup, no caching**. That is not a technical preference; it is the term. Practically, for tarima this means: a scraped discovery layer whose *output* is a database table is **structurally incompatible** with the caching design in the parent plan (tier 0 cache, 14 d place lists, 7 d hours, 90 d phone). Either (i) you store nothing and re-fetch per session, which costs requests and defeats the tier-0 cache, or (ii) you store and breach §3.2.3(b). There is no third option. **This is the single strongest argument against the Google scrape tier: it is not just risky, it is architecturally incompatible with the caching design the owner already approved.** By contrast, Geoapify (cache/store/redistribute allowed), Overture (CDLA-Permissive-2.0, store freely) and venue own-sites (free, business-published) all fit the cache design.

## 1.5 cauce findings (engines + fetch_and_index)

- **Does cauce have a DuckDuckGo engine?** Yes, but it is an **exec** engine, not a declarative one: `crates/cauce-core/src/config/mod.rs:1351` defines `EngineId::new("ddgs")`, `kind = Exec`, `command = "python3"`, `args = ["sdk/python/cauce_engine_sdk/ddgs_auto.py"]`, tier 2, page_size 10. The script (`sdk/python/cauce_engine_sdk/ddgs_auto.py`) calls the third-party `ddgs` Python package with `backend="auto"` and maps `title/href/body` to `title/url/snippet`.
- **Is it working?** **No.** The live instance reports `"engine":"ddgs","failures":148,"breaker":"open","last_error":"transport error: engine process exited","last_ok_at":null`. The `ddgs` package (9.16.0) *is* installed in `sdk/python/.venv`, so this is not a missing dependency - the exec process is dying. The `bing` and `brave` declarative engines are healthy today (6 and 5 requests, breakers closed, 100% reliability, p95 345 ms and 1,282 ms).
- **Can cauce host a DDG engine declaratively?** **Structurally yes**: `engines/bing.yaml`, `engines/brave.yaml`, `engines/wikipedia.yaml` are the pattern, and the spec language supports url template + CSS/JSONPath parsing + `detect.blocked` + `detect.rate_limited_status` + `unwrap_redirect`. But (i) the declarative layer is **GET-only**, and the DDG vqd flow needs a POST to `duckduckgo.com/?q=&vqd=...`; (ii) DDG captcha'd on request #1 in the spike, so a declarative spec would need `detect.blocked: ["challenge","anomaly","Select all squares"]` and would then permanently return `Blocked`. A DDG engine in cauce is not currently a useful thing to build.
- **Can `fetch_and_index` serve as the fetcher?** Yes, for *venue own sites* (tier 2) - it is already the right tool: SSRF-guarded, per-host rate-limited, capped, archived, searchable via `search_archive`. It is **not** suitable as the fetcher for Google/DDG: it returns only readability markdown (no JSON, so no `tbm=map` parsing), it impersonates a Chrome UA, it does not consult robots.txt, and it has no per-host budget/circuit-breaker concept beyond a token bucket. For a scrape tier, tarima needs its own thin fetcher with a tarima-identifying UA and a robots gate.

---

# Deliverable 2 - The spike (honest results)

**Method.** Budget: 12 content fetches total, all sources. Robots.txt fetched first for 8 hosts (`/tmp/tarima-scrape/robots/`). One request per >=5 s (enforced by `fetch.sh` with a `sleep 5` between calls). UA: `tarima-research-bot/0.1 (contact: dev@tarima.local; research spike)` - a generic identifying string, **not** a browser impersonation. No proxies, no rotating IPs, no captcha solving, no stealth plugins, no fingerprint spoofing. Sources that served a captcha were stopped immediately. Raw responses + headers saved in `/tmp/tarima-scrape/raw/`. Full ledger: `/tmp/tarima-scrape/fetch_summary.txt`; per-request log: `/tmp/tarima-scrape/fetch.log`.

**Disclosure of one rules violation.** Fetch #12 (`bing_local_q2`, `www.bing.com/search?...&format=rss`) hit a path that `www.bing.com/robots.txt` disallows for `*` (`Disallow: /search`, `Disallow: /Search`). The robots file **was** fetched at the start of the session and is in `/tmp/tarima-scrape/robots/`, but I failed to apply its `Disallow: /search` rule to the `format=rss` variant when choosing the URL - a rule-application error, not an omission. It is logged here rather than buried, it was not repeated, and no other disallowed path was fetched: `www.google.com/robots.txt` disallows `/search` for plain queries, so I fetched only the `tbm=map` variant, which is explicitly allowed, and the `/maps/search/` and `/maps/place/` paths, which are explicitly allowed.

**What actually worked**

1. **`tbm=map` (Google, robots-allowed, plain HTTP, no browser)** - worked, and worked well. HTTP 200, 17.9 KB JSON, 0.45 s. The parser sketch `/tmp/tarima-scrape/parser/extract_tbmmap.py` extracts place_id, kg_id, name, address, lat/lng, rating + review count, website, phone (display + E.164), categories, neighborhood, timezone, the full weekly hours grid with per-day open/close minute pairs, holiday override notes ("Veterans Day might affect these hours"), the Reserve dining URL, and accessibility attributes. The extracted phone `+1 510-843-2739` matches the OSM record for the same venue, which is a correctness cross-check.
2. **Google Maps `/maps/search/` and `/maps/place/`** - HTTP 200, but **no data**: JS shells. `APP_INITIALIZATION_STATE` (36.9 KB / 32.7 KB) contains the query echo, a viewport and a tile-vector blob. No captcha, no consent wall, no phone, no hours.
3. **Bing RSS** - technically 200 with 10 parseable items, but the results did not honor the Berkeley query (US-locale Utah hardware stores) and the payload carries an explicit non-commercial-use copyright. **Not usable** for our purpose; also a robots violation (see above).

**What did not work**

4. **DuckDuckGo HTML (`html.duckduckgo.com/html/`)** - HTTP **202** with an image captcha: "Unfortunately, bots use DuckDuckGo too. Please complete the following challenge to confirm this search was made by a human. **Select all squares containing a duck**." 14,266 b, 0.22 s, 67 `anomaly` markers. **Source stopped** per the rules.
5. **DuckDuckGo Lite (`lite.duckduckgo.com/lite/`)** - HTTP **202**, identical captcha (46 `challenge` markers), 14,272 b, 0.19 s. **Source stopped.**
6. **DuckDuckGo JS site (`duckduckgo.com/?q=...&ia=web`)** - HTTP 202, 22,660 b, **no `vqd` token** and no results; the body says "You are being redirected to the non-JavaScript site". So the vqd flow cannot even be *started* over plain HTTP without first executing JS (the token is minted by a script) - which needs a browser, i.e. 300-800 MB RSS on this VPS, and would still land on the captcha wall that DDG serves to non-browser clients.
7. **DDG Maps** - `maps.duckduckgo.com` is **NXDOMAIN** (verified with `nslookup`). `duckduckgo.com/local?q=...` 302s to `duckduckgo.com/?q=local&q=...&rpl=1`, i.e. the Maps/local UI is the JS app (Apple/MapKit-backed) with no server-rendered place records. Nothing to scrape without a browser, and the Apple/MapKit data behind it is Apple's licensed data, not DDG's to redistribute.
8. **`tbm=map` on the second query ("Ace Martial Arts Studio Berkeley")** - HTTP 200, 4,945 b, **empty**: the query is echoed, the viewport is set, there is no place item and **no error and no block**. Silent no-data. This is the most important negative finding about the endpoint: it is not "Google Maps in a GET", it is a query-dependent, partially-populated feed. A scraper that treats an empty payload as "no phone, no hours" would produce **false negatives** in the venue catalog.

**Robots.txt findings (checked before fetching, 2026-11-05)**

| Host | Verdict for the paths of interest |
|---|---|
| `html.duckduckgo.com` | `User-agent: * / Allow: /` -> allowed (comment: "Ensure all paths are crawled so their noindex tags/headers are respected") |
| `lite.duckduckgo.com` | `User-agent: * / Allow: /` -> allowed |
| `duckduckgo.com` | `Disallow: /lite`, `Disallow: /html`, `Disallow: /*?` (with `Allow: /?*` for root query strings) -> the HTML/lite SERP hosts are documented as disallowed from the main host, yet allowed from their own hosts; DDG is internally inconsistent |
| `maps.duckduckgo.com` | NXDOMAIN - no host |
| `www.google.com` | `Disallow: /search` **but** `Allow: /search?*tbm=map`; `Disallow: /maps?` with `Allow: /maps?q=`, `Allow: /maps/search/`, `Allow: /maps/place/`, `Allow: /maps/dir/`, `Allow: /maps/@`; `Disallow: /maps/api/js/` (only the JS API bundle) |
| `maps.google.com` | byte-identical to `www.google.com` (verified by `diff`) |
| `www.bing.com` | `Disallow: /search` and `Disallow: /Search` for `*`; `Allow: /api/maps/`; also `Disallow: /local`, `Disallow: /maps/adsendpoint` |

**Anti-bot summary:** DDG captcha'd immediately (2 of 2 robots-allowed SERP endpoints). Google served everything I asked for without a challenge - but only 4 requests, one query shape, one IP. That is a sample of 4, not a rate-limit finding.

**Reproduction:** `bash /tmp/tarima-scrape/fetch.sh <name> <url>` (5 s spacing, tarima UA, saves `raw/<name>.html` + `raw/<name>.headers`); `python3 /tmp/tarima-scrape/parser/extract_tbmmap.py /tmp/tarima-scrape/raw/gmaps_tbmmap_q1.html` prints the extracted record.

---

# Deliverable 3 - Recommendation

## 3.1 Ranked sources by value/risk (the owner's expectation, tested)

| Rank | Source | Value | Risk | Verdict |
|---|---|---|---|---|
| 1 | **Venue own website (JSON-LD / NAP / tel: / mailto:)** via cauce | Highest: hours, phone, email, website, capacity hints, "good for groups" prose - and it is the business's own machine-readable publication | Lowest: robots-checkable, business-published, freely storable, free, no browser | **USE** (promote to tier 2 priority) |
| 2 | **Google Places API (New), shortlist-only, free tier** | High for hours/phone/website/rating/price on exactly the venues that need it; `goodForGroups` via Atmosphere | Low: contractual, bounded, $0 inside 1,000 free Details-Enterprise calls/mo; the only real constraint is the no-caching rule | **USE** |
| 3 | **Overture bulk (tier 1.5) + FSQ OS Places** | High for email/phone/website/socials/operating_status at 88.4M places, store-forever, zero per-call cost | Very low: permissive licences | **USE** (already in the plan) |
| 4 | **DuckDuckGo (HTML/lite/JS/maps)** | **Zero measured** - captcha at request #1 | High: escalation fight, captcha-solving, browser footprint, DDG has an official paid API partner route and no rights grant for syndication | **DO NOT USE** |
| 5 | **Google Maps place pages / `/maps/search/` (browser)** | High (same data as #6) | Highest technical: browser footprint + consent walls + layout churn + no ToS relief | **DO NOT USE** |
| 6 | **`search?tbm=map` (plain HTTP, undocumented)** | Highest per request: 17.9 KB of complete place metadata in one GET | High legal (§3.2.3(a) no scraping, §3.2.3(b) no caching) + medium technical (positional schema, silent empties) + **architecturally incompatible with the tier-0 cache** | **USE BEHIND FLAG** - emergency fallback only, with an explicit written risk acceptance |
| 7 | **Bing** | Nothing new for place metadata | Medium: robots-disallowed `/search`, non-commercial-only terms, `mkt` correctness | **DO NOT ADD** (cauce already scrapes Bing for generic web search; do not extend that posture to place data) |
| 8 | **Google Search local pack / knowledge panel** | Same as #6 | Highest: robots-disallowed, browser-only, legal | **DO NOT USE** |

## 3.2 Verdict per source (one line, explicit)

- **Venue own sites via cauce `fetch_and_index`**: **USE.** Cheapest, safest, best coverage of the fields OSM lacks (email, capacity, good-for-groups prose). Needs a tarima-side robots check (cauce has none) and a tarima-identifying UA (cauce currently sends a Chrome UA).
- **Google Places API (New)**: **USE**, shortlist-only, live-only, 1,000 free Details-Enterprise calls/mo. Do not enable Atmosphere tier unless `goodForGroups`/`curbsidePickup`/`dineIn` proves to move the KPI. Note: no email field, no capacity, no popular-times data, no price-level-free path.
- **Overture + FSQ OS Places**: **USE** (unchanged from the parent plan). Free bulk email/phone/website; store forever.
- **Foursquare Places API**: **USE, shortlist only** - 500 free Pro calls/mo; free Pro fields include `email`, `tel`, `website`; `hours`/`rating`/`price`/`hours_popular` are Premium ($18.75 CPM, no free allowance). Use it for the fields Google lacks (email), not as a Google substitute.
- **DuckDuckGo**: **DO NOT USE.** Captcha at request #1, no ToS grant for syndication, browser-only path, official API exists for those who want programmatic access.
- **Google Maps place pages / `/maps/search/`**: **DO NOT USE.** Browser footprint on a 6-core/11 GB VPS, highest breakage, no legal relief.
- **Google `tbm=map`**: **USE BEHIND A DEFAULT-OFF FLAG** - as a last-resort fallback for a shortlist venue where OSM/Geoapify/Overture/FSQ and the venue's own site all came up empty, with live-lookup-only semantics (no storage of the scraped values beyond the session, to stay as close as possible to §3.2.3(b)), never in the same process or account as the Places API key.
- **Bing**: **DO NOT ADD** for place metadata.

## 3.3 Tier 2b design (only if the owner proceeds)

**Naming and placement:** `tier 2b - flagged scrape enrichment`, sitting between tier 2 (venue own site) and tier 3 (LLM extract). It is *not* part of the normal ladder; it is a fallback arm that runs only when the compliant arms have failed for a specific venue, and only when the flag is on.

**Feature flag and kill switch**

```bash
TARIMA_SCRAPE_GOOGLE=0            # default OFF. 0 = disabled, 1 = enabled. Master switch.
TARIMA_SCRAPE_ALLOWED_HOSTS=www.google.com   # hard allowlist; a host not listed is never fetched.
TARIMA_SCRAPE_SOURCES=tbm_map     # which sources in this tier are permitted. Currently only tbm_map.
TARIMA_SCRAPE_DAILY_CAP=25        # global cap across all scrape sources per day (hard stop, persisted in SQLite).
TARIMA_SCRAPE_PER_HOST_DAILY_CAP=15
TARIMA_SCRAPE_MIN_INTERVAL_MS=5000 # minimum 1 req / 5 s per host
TARIMA_SCRAPE_JITTER_MS=2500       # added uniform jitter on top of the interval
TARIMA_SCRAPE_BLOCK_THRESHOLD=3    # N blocks/captchas -> source disabled
TARIMA_SCRAPE_BLOCK_COOLDOWN_H=24  # cooldown after the breaker opens
TARIMA_SCRAPE_MAX_RESPONSE_KB=64   # hard cap on the response body we will parse
TARIMA_SCRAPE_CACHE_TTL_HOURS=12   # session-scoped cache TTL for a live-lookup result
TARIMA_SCRAPE_USER_AGENT="tarima-bot/0.1 (+https://tarima.local/bot; contact=ops@tarima.local)"
TARIMA_SCRAPE_LEGAL_ACK=0          # must be set to 1 by the owner to enable anything at all
```

`TARIMA_SCRAPE_GOOGLE=1` without `TARIMA_SCRAPE_LEGAL_ACK=1` is a hard no-op. The two are separate on purpose: the legal acknowledgement is a one-time owner decision, the flag is the operational switch.

**Per-host budget and global cap.** A `scrape_budget` table in tarima's SQLite: `(day, host, source, calls, blocks)` with a single-row `scrape_budget_day` for the global cap. Enforcement is pre-flight: read counters, refuse if the cap would be exceeded, never rely on a post-hoc check. This mirrors brioso's `spendLedger` shape already in the parent plan.

**Rate limiting.** Per host, a token bucket with a 1 req/5 s floor plus 0-2.5 s uniform jitter. Jitter is not obfuscation - it is politeness, so that a burst of users does not produce a periodic pattern. The bucket is keyed by host, so a slow host cannot starve another.

**Circuit breaker.** Per (host, source). Trip conditions: a captcha/challenge marker in the body, HTTP 429, HTTP 403, HTTP 5xx, or a parse that yields neither `place_id` nor a place item **twice in a row**. Open for 24 h, then one half-open probe. After 3 trips, the source is disabled for good and the tier degrades to "no scrape tier" permanently for that session. The breaker state lives in SQLite, not memory, so a restart does not reset it.

**Robots gate (mandatory, before every fetch).** Tarima-side: fetch `<host>/robots.txt`, cache 24 h per host, parse the `*` group, and refuse any path that is disallowed. Precedence: the longest matching rule wins, with `Allow` beating `Disallow` on a tie (Google and Bing both document this). For `www.google.com`, the resolved verdicts are: `/search` disallowed, `/search?*tbm=map` **allowed**, `/maps/search/` **allowed**, `/maps/place/` **allowed**. If robots.txt cannot be fetched, **do not fetch the path** - treat it as disallowed.

**Provenance fields on every value.** Every metadata row carries:

```
source_kind      'scrape' | 'api' | 'osm' | 'overture' | 'jsonld' | 'page_text'
source_name      'google_tbm_map' | 'google_places' | 'fsq' | ...
source_url       the exact URL fetched (never the raw page body)
fetched_at       unix seconds
expires_at       unix seconds (per-field TTL)
field_confidence 'high' | 'medium' | 'low'
```

The parent plan's `contact_source` column is the same idea and must be extended with `source_url` and `fetched_at` so any value can be traced back to the exact request that produced it. A value with no provenance row is invalid, not merely discouraged.

**Cache TTLs per field** (extending the parent plan's §2.2 policy, which already differentiates 7 d hours / 90 d phone):

| Field | Compliant-tier TTL | Scrape-tier TTL |
|---|---|---|
| opening hours | 7 d | **12 h** (and never across a DST or holiday boundary without re-fetch) |
| phone / website | 90 d | **12 h** |
| rating / review count | 7 d | **12 h** |
| price level | 30 d | 12 h |
| categories | 90 d | 90 d (stable, and not personal data) |
| place_id | indefinite (allowed by the Places ToS) | indefinite (it is Google's identifier; storing it is expressly permitted) |
| lat/lng | 30 d | 30 d (mirrors §14.3 even though a scrape is outside the grant - matching the strictest sensible rule) |
| email / capacity / good-for-groups | 90 d | **never from a scrape** - these come from the venue's own site or FSQ/Overture |

**No redistribution of raw scraped pages.** The scraper stores **structured fields plus provenance**, never the raw HTML/JSON body, never a snapshot of the Google page, never a copy of the venue's listing. `source_url` is recorded as a pointer (the Google Maps URL the human can open and check). No scraped value may be exposed in the agent's user-facing answer as if it were a first-party fact: the agent must be able to say where it came from, and for scrape-tier values it should say "hours as of <timestamp>" and name the source. Raw response bodies live only in the transient in-memory buffer of the fetch call and are discarded; the only persisted artifact is the extracted record. If a future need arises to persist raw bodies (for debugging), it must be written to a separate, access-controlled, auto-expiring debug directory outside the venue catalog - and it must never be served to users.

**Graceful degradation.** The enrichment orchestrator's chain for a venue with missing metadata:

```
tier 1    Geoapify / OSM tags (already have it)
tier 1.5  Overture / FSQ OS Places bulk lookup (already have it)
tier 2    venue own site via cauce fetch_and_index + JSON-LD/NAP extractor  <-- default path
tier 1e   Google Places API (New) details, shortlist only  (if FSQ key + budget)
tier 2b   scrape (tbm_map) ONLY IF: flag on AND legal ack on AND the venue is in
          the shortlist AND the global/per-host budget allows AND the value
          is still missing AND the value is not in {email, capacity, popular_times}
tier 3    LLM extract over a page we already fetched (never sets a contact field)
```

Every tier-2b result must be marked `degraded = true` and earn the short TTL. When tier 2b is disabled, expired, or blocked, the orchestrator returns tier 2/1.5 results unchanged and simply reports fewer fields. **No user-visible error, no empty results, no latency spike** - the tier is additive.

**Footprint.** Tier 2b is a plain `fetch` with a 64 KB body cap. No browser, no Playwright, no new dependency, no extra process. Estimated steady-state cost: <=25 requests/day, ~18 KB each, <500 KB/day of traffic and ~0 RSS. It does not change the VPS footprint at all.

**Legal/ToS risk statement the owner must accept explicitly (to be signed before `TARIMA_SCRAPE_LEGAL_ACK=1`):**

> "I acknowledge that tier 2b retrieves Google Maps place data from an undocumented Google endpoint (`search?tbm=map`) without a Google Maps Platform licence. I understand that this (i) is contrary to section 3.2.3(a) (No Scraping) and section 3.2.3(b) (No Caching) of the Google Maps Platform Terms of Service; (ii) means the retrieved values (hours, phone, website, rating, price level) may not lawfully be stored by tarima, which is why tier 2b is live-lookup-only with a 12-hour TTL and stores no raw pages; (iii) exposes the tarima host IP to blocks and captchas without notice; (iv) means the tier must never run in the same process, project or billing account as the Google Places API key, because a single Google account that has accepted section 3.2.3 and also scrapes Google Maps risks termination of that account and the key; and (v) that tarima is a self-hosted application used for a small commercial purpose, so the realistic downside is loss of the source and, if Google escalates, contractual termination and possible claims - which tarima may not be able to afford. I accept this risk, and I can turn it off at any time with TARIMA_SCRAPE_GOOGLE=0 without a redeploy."

Additionally the owner must accept that **the tier's output is architecturally incompatible with the approved tier-0 cache** (parent plan §2.2): scraped values cannot be stored for 7/90 days, so any UI that promises cached place metadata must not mix scrape-sourced and compliant-sourced rows without distinguishing them, and a Google Places API value and a `tbm=map` value for the same venue must never be silently merged into one row.

**Separation enforcement (code-level).** `apps/api/src/services/providers/google_scrape.ts` must live in a module that (i) has no import path to the Places API client, (ii) has no access to the billing/credentials provider, (iii) refuses to start if `TARIMA_SCRAPE_GOOGLE=1` and `TARIMA_SCRAPE_LEGAL_ACK!=1`, and (iv) has a unit test asserting that no scraped value is ever written into a column that the Places API policies would forbid (i.e. a `scrape_*` table separate from `venue_catalog`, or a strict `source_kind='scrape'` marker checked by the contract validator). A lint rule / CI check that greps for `googleapis` imports inside `services/providers/google_scrape.ts` is the cheapest way to make this stick.

## 3.4 Exact additions to the plan

### Plan §1.2 (candidate sources table)

Replace the row `**Google Maps / Google Search scraping** | See the scraping tier (§1.3) - recommendation is **do not** | n/a | n/a | Best data, worst terms | **Not recommended**` with:

> `**Google Maps via tbm=map (undocumented, tier 2b)** | Free but unsupported; no published limits | Google Maps Content: place_id storable indefinitely, lat/lng 30 d, nothing else storable (Maps Platform ToS 3.2.3(b) + SST 14.3) | ToS 3.2.3(a) No Scraping - a breach, not a grey area | Highest per-request payload measured: 17.9 KB JSON = hours (incl. holiday notes), phone (E.164), website, rating+count, categories, tz, place_id, reserve URL, accessibility. Positional schema, ~50% silent-empty in a 2-query sample | **Behind a default-off flag, emergency fallback only.** Not a primary source.`
>
> `**DuckDuckGo (HTML/lite/JS/maps)** | n/a | n/a | No scraping clause in DDG ToS/AUP, but DDG's robots disallows /lite /html from the main host and the Instant Answers API disclaimed result syndication | **Zero:** captcha on request #1 from both robots-allowed SERP endpoints; maps.duckduckgo.com is NXDOMAIN; /local is a JS app | **Do not use**`

### Plan §1.3 (scraping tier)

Replace the closing sentence `**Do not** fetch google.com/maps or google.com/search from tarima code, ever; this should be a coded, testable prohibition.` with:

> `**Do not** fetch google.com/maps place pages or google.com/search (plain query) from tarima code, ever; this should be a coded, testable prohibition. **Exception (owner-acknowledged, default off):** `https://www.google.com/search?tbm=map&q=<query>` is robots-allowed, plain-HTTP, and returns a complete place record in one GET; it may be used only as a tier-2b emergency fallback for shortlist venues whose metadata is otherwise missing, only when `TARIMA_SCRAPE_GOOGLE=1` AND `TARIMA_SCRAPE_LEGAL_ACK=1`, only live-lookup with a 12 h TTL, never storing raw pages, and never in the same process or billing account as a Google Places API key. See the addendum at /tmp/tarima-scrape.md §3.3 for the full design and the risk acceptance text.`

Also update the "Do not do" list: replace `no SERP-proxy services that resell Google data (SerpAPI-style)` with the same wording plus `no DuckDuckGo HTML/lite scraping - a captcha is served on the first request and DDG has an official API for programmatic access`.

### Plan §1.4 (tier ladder)

Insert between the `tier 2 crawl/enrich` and `tier 3 LLM extract` lines:

```
tier 2b flagged scrape   DEFAULT OFF (TARIMA_SCRAPE_GOOGLE=0 + TARIMA_SCRAPE_LEGAL_ACK=0).
                           tbm=map only, plain HTTP, robots-checked, allowlisted host,
                           >=1 req/5 s + jitter, <=25/day global, <=15/day per host,
                           breaker after 3 blocks (24 h), live-lookup only (12 h TTL),
                           provenance on every value, no raw pages stored, no Places-API
                           key in the same process/account.
```

And amend the `never` line:

```
never   Google Maps/Search scraping (except the flagged tier 2b above), resold SERP APIs,
        DuckDuckGo HTML/lite scraping, guessed emails
```

### Plan §3.1 phases

- **Phase 0 (keys and stance)**: add two decisions. (10) *"Approve a Google Places API (New) key, live-only, shortlist-only, 1,000 free Details-Enterprise calls/month, no caching of anything but place_id and lat/lng."* Default: yes (it is the cheapest path to the hours/phone the owner measured as missing). (11) *"Approve or decline tier 2b (Google tbm=map scraping) behind a default-off flag, with a signed risk acceptance."* Default: **decline now; the mechanism ships, the flag stays 0**, and revisit only if tier 1 + tier 1.5 + tier 2 + Places API still miss the metadata KPI on the golden set.
- **Phase 3 (metadata enrichment ladder)**: this is where the value is, and it should be re-ordered to put the *compliant* enrichment first and to move the venue's own-site extraction earlier than FSQ, because the venue's site is free, freely storable, and the only source of email, capacity and good-for-groups prose. Concretely: `apps/api/src/services/providers/foursquare.ts` (shortlist details) stays; `apps/api/src/services/enrich.ts` keeps the chain `OSM -> Overture -> venue own site (cauce) -> FSQ -> Places API -> tier 2b (if enabled)`. Add to the KPI gate: *"on the Berkeley golden set, metadata completeness >=60% phone / >=50% hours measured AFTER the compliant chain; tier 2b is not permitted to be the reason the gate passes."* - i.e. tier 2b must never be load-bearing for a KPI.
- **Phase 5 (optional upgrades)**: add *"tier 2b activation (only if the owner signs the risk acceptance)"* as an explicit, separately-approved phase - never bundled into another phase's acceptance.
- **New phase 3.5 (recommended, optional)**: *"cauce hygiene"* - fix or remove the broken `ddgs` exec engine (148 failures, breaker open, last_error "engine process exited"), change cauce's `DEFAULT_USER_AGENT` to a tarima-identifying UA, and add robots.txt compliance to `fetch_and_index` upstream (or keep the tarima-side check and note the gap in cauce's README, per the parent's unchecked list). This is small, removes a live failure, and makes the compliant tier 2 path materially more robust. It is arguably higher ROI than tier 2b.

### Plan §3.3 risk register - new rows

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google blocks the tarima IP for `tbm=map` scraping | High | Medium | breaker after 3 blocks; 25/day cap; 1 req/5 s + jitter; tarima UA; degrade to compliant tiers silently |
| Scrape-sourced values are stored, breaching ToS 3.2.3(b) | Medium | High (contract) | scrape values live in a separate table marked `source_kind='scrape'` with a 12 h TTL; CI check that the scrape module cannot write `venue_catalog` contact columns; no Places API key in the same project/account |
| `tbm=map` schema shifts silently | High | Medium | assert `place_id` presence (not index positions); snapshot-compare extracted fields each run; a missing field is "source degraded", never "the venue has no phone" |
| `tbm=map` returns empty payloads (observed 1 of 2) | High | Medium | empty is a miss, not a negative fact; never write an empty-derived null into the catalog |
| DDG captcha / block | Certain (observed) | Low | DDG not used; if ever, `detect.blocked` markers + breaker |
| Placeholder venues: OSM has no record, so nothing to enrich | Medium | Medium | the scrape tier does not solve discovery, only metadata; keep Overture/Geoapify as the discovery arm |

### Plan §3.4 open decisions - renumber and add

- New decision (owner): *"Tier 2b (Google `tbm=map` scraping) - approve with a signed risk acceptance, or decline?"* Default: **decline; ship the mechanism with the flag off.**
- New decision (owner): *"Google Places API (New) key - approve live-only, shortlist-only?"* Default: **yes**, ≤1,000 free Details-Enterprise calls/month, no persistence beyond `place_id`/lat-lng.

### Plan Appendix A - add to the verified-source log

| Claim | Source | URL |
|---|---|---|
| Maps Platform ToS 3.2.3(a) No Scraping / (b) No Caching; SST 14.3 (lat/lng 30 d), SST Part A §3 (place_id cacheable) | Google Maps Platform Terms + Maps Service Specific Terms (SST last modified 2026-10-28) | developers.google.com/maps/terms; cloud.google.com/maps-platform/terms/maps-service-terms |
| Places policies: no pre-fetch/cache/store beyond exceptions; place_id exempt | Places API policies (last updated 2026-11-03) | developers.google.com/maps/documentation/places/web-service/policies |
| Places API (New) pricing: Details Pro 5,000 free/$17; **Details Enterprise 1,000 free/$20**; Enterprise+Atmosphere 1,000 free/$25; Text/Nearby Pro 5,000 free/$32; Essentials 10,000 free/$5; IDs-only unlimited; **no Contact Data SKU in the New API** | Pricing page (last updated 2026-11-03) + data-fields table | developers.google.com/maps/billing-and-pricing/pricing; .../places/web-service/data-fields |
| Places API has **no** email / capacity / popular-times data field; `goodForGroups` etc. are Enterprise+Atmosphere | data-fields table | developers.google.com/maps/documentation/places/web-service/data-fields |
| Popular times: display-only `<gmp-place-popular-times>` (Maps JS 3.66.13d, 2026-11-04) | Maps JS release notes + Places UI Kit docs | developers.google.com/maps/documentation/javascript/releases; .../places-ui-kit/place-details |
| DDG ToS + AUP contain **no** scraping clause | duckduckgo.com/terms (2025-01-07), duckduckgo.com/acceptable-use | same |
| Bing: robots disallows /search; MSA §3.a.vi + §14.f.i noncommercial; RSS copyright requires written permission for other use; Bing Search APIs retired 2025-08-11 | robots.txt, Microsoft Services Agreement, learn.microsoft.com lifecycle | microsoft.com/en-us/servicesagreement; learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement |
| Spike: DDG html/lite return HTTP 202 duck-captcha on the first request; `maps.duckduckgo.com` NXDOMAIN; Google place pages and `/maps/search/` are JS shells with no place payload; `search?tbm=map` returns a full place record (place_id, E.164 phone, website, weekly hours + holiday notes, rating/count, categories, tz, reserve URL, accessibility) but returned an empty payload for the second query | our own live run, raw responses kept | /tmp/tarima-scrape/raw/, /tmp/tarima-scrape/parser/extract_tbmmap.py |
| cauce live state: `ddgs` exec engine broken (148 failures, breaker open, "engine process exited"); bing/brave declarative engines healthy; declarative engines are GET-only; `DEFAULT_USER_AGENT` is a Chrome impersonation; `fetch_and_index` has no robots compliance, returns markdown only, 1 MB / 30 s caps | cauce source + live instance | ~/Documents/prjcts/_own/cauce (crates/cauce-core/src/http.rs:56, crates/cauce-core/src/archive/fetch.rs, crates/cauce-core/src/config/mod.rs:1351); search.localhost:4479/api/engines |

### Plan Appendix B - unchecked / deferred (additions)

- The `tbm=map` positional schema was characterised from **one** successful payload (Triple Rock). The index map in `parser/extract_tbmmap.py` is a sketch and will break; a real implementation must locate fields by content (as the sketch already does for phone and accessibility) and by sentinel values.
- Hit rate for `tbm=map` is **unknown**: 1 of 2 queries returned data. A larger sample (say 50 venue queries) was not run - the spike budget was 12 fetches.
- No headless-browser run was performed against any source (by design: the footprint is the point, and a browser test would have exceeded the fetch budget).
- The DDG captcha was not bypassed and its difficulty was not characterised; no captcha-solving service was contacted.
- Places API (New) field-level SKU attribution was read from the published tables, not measured on a live billed account (no key, by instruction).
- Foursquare's "hours_popular" (a popular-hours field that is *not* Google's popular-times histogram) is Premium-only and was not verified against a live call.
- The `tbm=map` endpoint's behaviour under a datacenter IP (as opposed to this machine's residential IP) is **unknown** and is the single biggest technical unknown for tier 2b: the VPS IP may be challenged immediately where this machine was not.
- Whether `fetch_and_index`'s readability extraction preserves `application/ld+json` script blocks was not tested - if it does not, tier 2 needs a raw-HTML mode in cauce.

## 3.5 The one-paragraph answer for the owner

Yes, enrichment is needed, but the scraping route is not where the value is. The spike's most useful finding is that Google publishes a robots-allowed, plain-HTTP endpoint (`search?tbm=map`) that returned the complete Triple Rock record - hours including a Veterans Day override, E.164 phone, website, 4.3/645 rating, categories, timezone and place_id - in a single 18 KB GET with no browser and no captcha; that same query on `/maps/place/` and `/maps/search/` returned a JS shell with nothing, and the same venue on DuckDuckGo returned a "select all squares containing a duck" captcha on the very first request. So the technical case for Google scraping is stronger than the parent plan assumed, but the legal case is weaker than the technical one: Maps Platform ToS 3.2.3(a) bans exactly what `tbm=map` returns, 3.2.3(b) bans storing it, and because a Places API key means accepting that same ToS, mixing them puts the compliant tier at risk too. The recommendation is therefore to spend the money where it is free: Overture and FSQ OS Places for email/phone/website at 88.4M places, the venue's own JSON-LD for hours/email/capacity/good-for-groups, and a Google Places API (New) key in live-only mode on the 1,000 free Details-Enterprise calls a month for the shortlist's hours/phone/website/rating; keep `tbm=map` implemented behind `TARIMA_SCRAPE_GOOGLE=0` + `TARIMA_SCRAPE_LEGAL_ACK=0` as a documented emergency fallback for venues that stay empty, with a signed risk acceptance, live-lookup-only semantics, provenance on every value, no raw page storage, and a breaker that shuts it off after three blocks; and drop DuckDuckGo entirely, since a captcha on request #1 is not a problem you can engineer away.

---

## Appendix - files produced by this session (all under /tmp, nothing in the repo)

```
/tmp/tarima-scrape.md                      this report
/tmp/tarima-scrape.status                  milestone log
/tmp/tarima-scrape/fetch.sh                the 5 s-spaced fetcher used
/tmp/tarima-scrape/fetch.log               per-request log
/tmp/tarima-scrape/fetch_summary.txt       the 12-fetch ledger + robots verdicts
/tmp/tarima-scrape/robots/*.txt            robots.txt for all 8 hosts
/tmp/tarima-scrape/raw/*.html              11 saved response bodies
/tmp/tarima-scrape/raw/*.headers          response headers for each
/tmp/tarima-scrape/parser/extract_tbmmap.py  working parser sketch for the tbm=map payload
```

Repo state: unchanged. No commits, no pushes, no sign-ups, no API keys, no branches. No tmux sessions were created, so no tmux cleanup was needed.
