# Tarima scout/discovery assessment

Date: 2026-11-05
Worktree: `~/.worktrees/tarima/scout-assess` (branch `work/scout-assess`, from `origin/work/sp3d-mirror`, HEAD `311be32 merge(sp7)`)
Read-only assessment. No code changed, nothing committed, nothing pushed.

## Headline answer

No. If a user types "look for venues" or "look for sponsors" today, the agent has **no discovery tool at all**. It has five tools and every one of them is a *read of a table that already exists* or a *write to the board*. There is no provider wired, no search surface, and no geo capability anywhere in the shipped code.

The `venue_catalog` table, the `search_cache` table, the venue-search provider seam, the cache-first service, and the MCP tool list all still exist in the tree, but the **only** code path that fills `venue_catalog` is a manual seed script that reads hand-written research markdown. The live provider chain (Photon discovery + Overpass enrichment) was deleted in SP7 (`255ad59`, `c97e7a3`) and nothing replaced it.

Worse for proximity: the deleted chain fetched `lat`/`lon` from Photon (`packages/venuesearch/src/photon.ts:146-149` in the old tree) but **never persisted them**. `venue_catalog` has no geo column and never had one (`apps/api/drizzle/0006_venue_search.sql`, `apps/api/src/db/schema.ts:333-363`). The old "proximity support" was city-bbox scoping at query time, not distance-to-user ranking. That capability was partial even before it was deleted, and today it is zero.

---

## 1. Inventory: every scout/search/discovery capability today

### 1a. Tools the agent can actually call (`apps/web/agent/tools/`)

| Tool | File | Provider | Text vs geo | Proximity support | Structured output | Auth/keys needed | Tested or stub-only | Status |
|---|---|---|---|---|---|---|---|---|
| `get_project_context` | `apps/web/agent/tools/get_project_context.ts:8` | tarima SQLite (`@tarima/api/db`) | neither (project + board read) | none | JSON: project goal, stage, entities | session cookie only | exercised by `apps/web/tests/turn/run.sh` (no unit test) | Survives SP7 |
| `list_venues` | `apps/web/agent/tools/list_venues.ts:8` | tarima SQLite `venue_catalog` | neither (exact `LIKE` on city) | none (city string match only) | JSON: name, area, capacity, priceBand, source, website, contactEmail, contactPhone | session cookie only | no unit test; rows injected by `apps/web/tests/turn/turn-seed-venues.mjs` (2 fake Berkeley rows) | Survives SP7 |
| `list_sponsors` | `apps/web/agent/tools/list_sponsors.ts:12` | tarima SQLite `entities` then `venue_catalog` fallback | neither (`LIKE` on name/goal/result JSON, then city/name) | none | JSON: id, name, status, contactEmail / website | session cookie only | no unit test | Survives SP7 |
| `update_task` | `apps/web/agent/tools/update_task.ts:12` | tarima SQLite `entities` | n/a (write) | none | JSON: `{id, from, to}` | session cookie only | no unit test | Survives SP7 |
| `send_email` | `apps/web/agent/tools/send_email.ts:25` | none (stages into `outbox`; no SMTP) | n/a (outbound write, HITL gated with `approval: always()`) | none | JSON: staged, outboxId, idempotencyKey | session cookie only; approval card | `apps/web/agent/tools/send_email.test.ts` (88 lines, real assertions) + `apps/web/tests/chat/approval-run.sh` | Survives SP7, added SP8 |

Read-only tools are explicitly exempted from the HITL gate (`apps/web/agent/approval.ts:26`), so `list_venues`/`list_sponsors` never prompt.

### 1b. Search/discovery capabilities that exist in the tree but are NOT reachable from the agent

| Capability | File | Provider | Text vs geo | Proximity | Structured output | Auth/keys | Tested or stub-only | Status |
|---|---|---|---|---|---|---|---|---|
| MCP tools `projects.list/create`, `entities.list/create/update` | `apps/api/src/services/tools.ts:50` | tarima SQLite | neither | none | JSON-RPC content blocks | bearer API key + scope (`apps/api/src/services/scopes.ts`) | `apps/api/src/routes/mcp.test.ts` | Survives SP7, no search |
| `workflow.trigger` MCP tool | `apps/api/src/services/tools.ts:78` | none | n/a | n/a | returns `{error: "engine_removed"}` | API key | n/a | **Dead stub** — the SP7 engine teardown |
| `venue_catalog` table + `search_cache` table | `apps/api/src/db/schema.ts:333`, `:372` | n/a (storage) | n/a | no geo column | n/a | n/a | `apps/api/src/lib/contract-freeze.test.ts` | **Orphaned**: `search_cache` has zero readers in the tree (`grep searchCache apps/web/src apps/api/src` → schema only) |
| `venueSearchRequestSchema` / `venueSearchResponseSchema` / `catalogVenueSchema` / `venueContactRequestSchema` | `packages/contract/src/venue.ts:32-59`, `:74-96` | n/a (frozen contract) | n/a | no lat/lon field | valibot | n/a | contract freeze test | **Orphaned**: exported from `packages/contract/src/index.ts:78-94`, imported by nothing |
| Seed loader for the venue catalog | `apps/api/scripts/seed-venues.ts:23`, data in `apps/api/scripts/seed-venues.data.ts` | hand-transcribed from `docs/venue_candidates_sf.md` + `docs/venue_candidates_malaga.md` | neither (human research, no API) | none (no coordinates at all in the seed data) | JSON rows into `venue_catalog` | none | not a test; 46 rows, 2 cities, `source` = markdown filename | Survives SP7 as the **only** filler of `venue_catalog` |
| `venue_catalog` bootstrap DDL + migration | `apps/api/src/db/index.ts:41-44`, `apps/api/drizzle/0006_venue_search.sql` | n/a | n/a | n/a | n/a | n/a | n/a | Survives SP7 |

### 1c. Capabilities that existed and were deleted in SP7

| Capability | Deleted file (readable via `git show <sha>^:<path>`) | Provider | Text vs geo | Proximity support | Structured output | Auth/keys | Tested or stub-only | Status |
|---|---|---|---|---|---|---|---|---|
| Photon discovery adapter | `packages/venuesearch/src/photon.ts` (deleted in `c97e7a3`) | `photon.komoot.io` (keyless, OSM) | geo-ish: text query + `bbox` + `lat`/`lon` params + `osm_tag` filter | **partial**: city bbox presets + optional centre point; no radius, no distance rank | `VenueCandidate[]` with `lat`/`lon`/`externalId`/`address` | none (public instance, fair-use only) | `photon.test.ts` over recorded fixtures `fixtures/photon-{sf,malaga,malaga-cafe}.json` (never network) | **LOST** |
| Overpass enrichment adapter | `packages/venuesearch/src/overpass.ts` (deleted in `c97e7a3`) | `overpass-api.de` (keyless, OSM) | geo: one OSM id per request | none (id lookup) | `VenueDetails` with contactEmail, contactPhone, website, capacity, **openingHours** | none | `overpass.test.ts` over stub fetch, retry/backoff/timeout asserted | **LOST** |
| Provider seam + defaults | `packages/venuesearch/src/providers.ts`, `types.ts`, `cities.ts` (deleted in `c97e7a3`) | — | `VenueSearchProvider` / `VenueEnrichProvider` interfaces; `CITY_PRESETS` for sf/malaga | bbox presets only | typed | — | — | **LOST** |
| Cache-first venue search service | `apps/api/src/services/venue-search.ts` (deleted in `255ad59`) | Photon + Overpass via the seam | geo | bbox presets | `SearchResult {rows, cache: hit\|miss, refreshing}` | none | `venue-search.test.ts` (216 lines) asserted: 1 provider call on miss, **0 calls** on hit, SWR refresh, contact only when OSM has it | **LOST** |
| Curation service (brief → candidate board rows, provider-chain fallback) | `apps/api/src/services/curation.ts` (deleted in `255ad59`) | Photon + Overpass | geo | bbox | `{candidates, considered, noContact}` | none | n/a | **LOST** |
| Provider chain wiring at boot | `apps/api/src/server.ts` (pre-`255ad59`): `setVenueSearchDeps(defaultProviders())` | public keyless pair | geo | bbox | n/a | none | n/a | **LOST** (this was the exact line that made "search" work) |
| `packages/chase` (brief parser, outreach drafter, reply parser, SFM) | `packages/chase/src/*` (deleted in `c97e7a3`) | LLM via `packages/llm` | text | none | `DraftOutreach`, `ParsedReply`, `ParsedBrief` | gateway key | `sfm.test.ts`, `engine.test.ts` | **LOST** |
| `packages/llm` (OpenAI-compatible provider, prompts, tasks) | `packages/llm/src/*` (deleted in `c97e7a3`) | any OpenAI-compatible gateway | text | none | typed | gateway key | `contract.test.ts`, `provider.test.ts` | **LOST** (replaced by eve + Bifrost) |
| `packages/api-keys` (hash/store) | `packages/api-keys/src/*` (deleted in `c97e7a3`) | — | — | — | — | — | `keys.test.ts` | **LOST**, replaced by `apps/api/src/services/api-key-auth.ts` |

### 1d. Framework-provided search that exists in eve but is NOT enabled for tarima

eve's default tool set includes `web_search` and `web_fetch` (`packages/eve/dist/src/framework/sources/registry.js`, `packages/eve/docs/concepts/built-in-tools.md:243`). Tarima does **not** author `apps/web/agent/tools/web_search.ts` (the agent dir contains only `get_project_context.ts`, `list_sponsors.ts`, `list_venues.ts`, `send_email.ts`, `update_task.ts`), so `web_search` rides on eve's defaults. What that resolves to today:

- eve's default is `webSearch({provider: "exa"})` (`packages/eve/dist/src/tools/provided/web-search.js`), but the `provider` setting applies only to **AI Gateway** models (`packages/eve/docs/concepts/built-in-tools.md:293`).
- Tarima's model is `createOpenAI({apiKey: BIFROST_VK, baseURL: BIFROST_BASE_URL})` (`apps/web/agent/agent.ts:13-16`), i.e. an OpenAI-compatible **Bifrost** gateway, model id default `zai-coding-plan/glm-5` (`apps/web/agent/agent.ts:27`). That is a **direct** provider model, not a gateway model.
- eve therefore resolves the native backend: `resolveWebSearchBackend` → `e.gateway ? ... : resolveNativeWebSearchBackend(e)` (`packages/eve/dist/src/harness/provider-tools.js`), and `NATIVE_WEB_SEARCH_BACKENDS = {anthropic, google, openai}` with the provider derived from the AI SDK provider name (`packages/eve/dist/src/harness/model-profile.js`, `provider: i.split(".")[0]`).
- Because `createOpenAI` is used without a custom `name`, the provider name is `openai` (`packages/eve/dist/src/compiled/@ai-sdk/openai/index.js`: `n = e.name ?? "openai"`), so eve attaches **OpenAI's hosted `web_search`** tool and sends it to the Bifrost gateway as `web_search_20250305`.
- The Bifrost gateway fronts `zai-coding-plan/glm-5`. Whether that upstream honours OpenAI's hosted web-search tool is a gateway-side question tarima does not control. eve's own doc warns about exactly this class of mismatch and recommends naming the provider so the agent gets **no** `web_search` (`packages/eve/docs/concepts/built-in-tools.md:322-333`).
- Consequence: `web_search` on tarima is **unverified and likely non-functional**, and even if it fired it would be **text-only**. There is no geo, radius, rating, or opening-hours in any of it.
- `web_fetch` (eve default) does work: it is a plain HTTPS GET with SSRF checks (`packages/eve/dist/src/tools/provided/web-fetch.js`). It is text-only.

So the agent's total real-world search surface is: two SQLite LIKE queries plus an unverified text web search.

---

## 2. Gap analysis

### 2a. Venues: what a good query flow needs vs what exists

| Requirement | What a good flow needs | Today | Verdict | Evidence |
|---|---|---|---|---|
| Geocode the brief's city/neighbourhood to a point | forward geocoder (Nominatim/Photon/Google Geocoding/Overture) | none | **MISSING** | no geocoder in `apps/web/agent/tools/`; `list_venues` matches the raw city string (`apps/web/agent/tools/list_venues.ts:19`) |
| Radius/box scoping around the point | radius or bbox filter on a geo provider | none | **MISSING** | no lat/lon column in `venue_catalog` (`apps/api/src/db/schema.ts:333-363`) |
| Distance-to-user ordering | stored coordinates + haversine sort | none | **MISSING** | no coordinate fields anywhere in `apps/api/src/db/schema.ts` or `packages/contract/src/venue.ts` |
| Venue discovery with type filter | places text/nearby search with category filter | none | **MISSING** | the only fillers are the 46-row hand seed (`apps/api/scripts/seed-venues.data.ts`) and nothing else |
| Capacity, price band | provider field or curated column | columns exist, almost always NULL | **PARTIAL** | `capacity`/`priceBand` are nullable and the seed explicitly leaves price bands unset (`apps/api/scripts/seed-venues.data.ts:5-8`) |
| Ratings / popularity | provider field | none | **MISSING** | no rating column, no provider |
| Opening hours | provider field | none | **MISSING** | `openingHours` existed only in the deleted `VenueDetails` type (`packages/venuesearch/src/types.ts:45`); the DB never had a column for it |
| Contact data (email, phone, website) | enrichment pass | columns exist, mostly NULL | **PARTIAL** | `contactEmail`/`contactPhone`/`website` columns exist (`apps/api/src/db/schema.ts:349-351`); seed notes say most rows carry none (`apps/api/scripts/seed-venues.data.ts:19-25`); the Overpass enricher is deleted |
| Dedup across sources | provider-keyed upsert | **partial**: the unique index survives, the upsert code does not | **PARTIAL** | `uniqueIndex("idx_venue_catalog_external")` (`apps/api/src/db/schema.ts:361`) and `uniqueIndex("idx_venue_catalog_city_name")` (`:358`) are still there; `upsertCandidates` was deleted with the service |
| Caching so repeated asks are cheap | query cache with TTL + SWR | table survives, all logic gone | **MISSING** | `search_cache` table (`apps/api/src/db/schema.ts:372-384`) has no reader/writer in the tree |
| Ranking by fit (capacity, requirements, price) | scoring over brief constraints | none | **MISSING** | `update_task`/board only; the deleted `curation.ts` did capacity matching, now gone |
| Write candidates onto the board | tool that creates entity rows | none | **MISSING** | `entities.create` exists only over MCP (`apps/api/src/services/tools.ts:63`), not as an eve tool |

**Venues verdict: MISSING.** Not "partial" — there is no path from "look for venues" to a venue that was not already in the catalog. The best case today is: the user asks about Berkeley, the agent finds 2 seeded rows (or 0), and reports them. The agent's own instructions tell it to say so plainly and suggest what to search next (`apps/web/agent/instructions.md:24-26`) — which is honest, but the product promise ("help me find venues") is unmet.

### 2b. Sponsors: what a good query flow needs vs what exists

Sponsors are a different shape: they are *companies and institutions* (AI credit vendors, restaurants, bars, tech companies), not POIs. The venue catalog doubles as a food/venue sponsor pool by fallback (`apps/web/agent/tools/list_sponsors.ts:46-51`), which is a hack that only returns rows whose city or name happens to contain the kind string.

| Requirement | What a good flow needs | Today | Verdict | Evidence |
|---|---|---|---|---|
| Web search for companies in a category ("AI credits for decision models") | text web search with good ranking | unverified `web_search` only | **MISSING (unverified)** | no `apps/web/agent/tools/web_search.ts`; eve default is native OpenAI search against Bifrost/GLM (`apps/web/agent/agent.ts:13-27`) |
| Company disambiguation / official site | search → verify domain | none | **MISSING** | `list_sponsors` returns `website` from the catalog only (`apps/web/agent/tools/list_sponsors.ts:59`) |
| Contact enrichment (email of a company) | enrichment provider or a contact API | none | **MISSING** | deleted `packages/chase` had `DraftOutreach`/`ParsedReply` but no contact discovery (`packages/chase/src/llm.ts`) |
| Sponsor ↔ venue overlap (same business is both) | dedup by domain/name across roles | none | **MISSING** | `list_sponsors` and `list_venues` are independent queries (`list_sponsors.ts:26-52`, `list_venues.ts:16-21`) |
| Proximity for local sponsors (restaurants, cafés) | geo search | none | **MISSING** | see venues table |
| Fit ranking against the brief (topic, audience, budget) | scoring | none | **MISSING** | `entities.goal`/`entities.result` are free-text JSON blobs (`apps/api/src/db/schema.ts` entities table) |
| Candidate persistence onto the board | tool to create an entity row | none | **MISSING** | see venues table |
| Human approval before any outreach | HITL gate | **GOOD** | `send_email` has `approval: always()` (`apps/web/agent/tools/send_email.ts:34`) and `approval.ts:28-32` gates every `send_*`/`outbound_*`/`post_*`/`email_*`/`whatsapp_*`/`telegram_*` tool |

**Sponsors verdict: MISSING for discovery, GOOD for outreach control.** The approval machinery is the one genuinely strong piece of the scout story, and it is the piece that matters most for sponsors (the risky part is contacting them, not finding them). But finding a sponsor is impossible today: `list_sponsors` only searches rows a human already put in the DB, matched by substring.

### 2c. What the deleted chain would and would not have fixed

Restoring the deleted `packages/venuesearch` + `apps/api/src/services/venue-search.ts` would take venues from MISSING to **PARTIAL**: real geo discovery with a category filter, bbox scoping for sf/malaga, cached repeated queries, and OSM contact enrichment with the honesty rule ("no tag means no contact", `packages/venuesearch/src/overpass.ts:15`).

It would still not give: distance-to-user ordering (no stored coordinates), ratings, opening hours (returned by the enricher but never persisted), sponsor discovery (Photon finds POIs, not sponsors), or city coverage beyond the two presets (a third city falls back to Photon's own geocoding with no bbox — `packages/venuesearch/src/cities.ts:6-9`).

---

## 3. Recommendation: ranked next steps

Ranking is by value-per-effort for the stated question ("look for venues" / "look for sponsors"), assuming a single small team and an existing VPS + SQLite stack.

### Step 1 — Restore the venue search chain as an eve tool, with a geo column added (highest value, mostly free)

- **Provider choice: Photon (photon.komoot.io) for discovery, self-hosted Overpass for enrichment.**
  - Why Photon: keyless, no card, OSM-backed, already has a written adapter, a tested URL builder (`photonUrl` with `bbox` + `osm_tag`), and recorded fixtures. It is the smallest diff that turns "look for venues" into a working query.
  - **Rejected alternative: Google Places API (New) Text Search / Nearby Search.** It is better data (ratings, hours, phone, photos) and proper radius search, but billing is per-SKU with a free cap of 5,000 calls/month for Nearby/Text Search Pro at $32/1k after that, the field mask decides the tier, and it needs a billing-enabled key with IP restrictions. It is the right *later* upgrade, the wrong *first* move for a beta with a two-city footprint. Evidence: https://developers.google.com/maps/billing-and-pricing/pricing
  - **Rejected alternative: Nominatim public.** Explicitly 1 req/sec, no bulk, and its policy says the public API "must not be built into, offered through, suggested by, or automatically generated by ... no-code, low-code, or vibe-coding platforms as a generic ... place search service" — i.e. exactly what an agent tool would be. It can be *suggested* to a user only with the policy surfaced. Evidence: https://operations.osmfoundation.org/policies/nominatim/
- **Self-hosting notes:**
  - Overpass: the public instance self-documents as "not-for-automation" and the OSM wiki says regular app use should stay under ~100 queries/day and that commercial use must be self-hosted or paid (https://wiki.openstreetmap.org/wiki/Overpass_API). A self-hosted Overpass needs ~500 GB NVMe / 32 GB RAM for the planet, far less for a country extract. Paid escape hatches: overpass.ch free tier 10k req/month at 30 req/min (https://overpass.ch/guides/overpass-api-alternatives), Overpass.ch, NextGIS, Overspan ($19/mo for 50k req/mo).
  - Photon self-host: planet build needs ~95 GB disk and 64 GB RAM, "as simple as downloading two files and starting the server" (https://github.com/komoot/photon). The public instance is throttled to ~1 req/sec and komoot states "if you have to ask about the usage limits, you are likely better off running your own instance" (https://github.com/komoot/photon/discussions/598).
  - Practical shape for tarima's VPS: the existing box runs `tarima.service` with SQLite at `/opt/tarima2/shared/data/tarima.db` and Litestream replication to R2 (`deploy/secrets-manifest.toml`). Add a **country-extract Overpass** (Malaga + SF are two extracts) or a paid Overpass plan; do not put a planet Overpass on that box.
- **What to reuse from the deleted `venuesearch`:** the whole provider seam (`types.ts` — `VenueSearchProvider` / `VenueEnrichProvider` / `VenueCandidate` / `VenueDetails`), `photonUrl` + `photonToCandidates` + `osmIdOf` (canonical `<type>/<id>` keys), the Overpass retry/backoff/timeout logic and its one-id-per-request discipline, `CITY_PRESETS` (extend it), and above all the **honesty rule**: a provider never invents a contact; a venue without one lands in the board's "no contact" bucket (`packages/venuesearch/src/types.ts:15-17`).
- **What to fix while porting it:** persist `lat`/`lon` (the deleted chain dropped them — add `latitude`/`longitude` columns to `venue_catalog` plus an index on city), persist `opening_hours` (the deleted enricher returned it and threw it away), persist `rating`/`price_band` if the provider gives them, and add a `provider` discriminator column so Google Places rows and OSM rows can coexist.
- **Where it lands in eve:** a new `apps/web/agent/tools/search_venues.ts` that (a) geocodes the city, (b) calls the provider, (c) upserts into `venue_catalog`, (d) returns a ranked shortlist with distance and the explicit "no contact" bucket. Register it read-only in `apps/web/agent/approval.ts:26` so it never prompts. Put the cache/SWR logic in `apps/api/src/services/venue-search.ts` (recreate it) or, better, in `packages/contract`-adjacent service code that both the eve tool and the MCP surface call, so MCP and the agent share one implementation the way `apps/api/src/services/tools.ts` does today.
- **Cost/key:** zero. Public Photon + self-hosted Overpass need no keys, no cards, no billing.

### Step 2 — Add a real web-search tool for sponsors and companies

- **Provider choice: Exa (`exa/auto` via an explicit `agent/tools/web_search.ts`) for sponsor discovery, with a hard rule that web results never become contacts on their own.**
  - Why Exa: it is the search provider eve's own framework layer already knows how to call (`packages/eve/dist/src/harness/provider-tools.js` → `gateway.tools.exaSearch({contents:{highlights:{maxCharacters:1000}}, numResults:10})`), it has a free tier of $10 credits/month plus a $10 onboarding bonus with no payment method, and it is priced transparently: $7/1k `auto` (10 results included) or $4/1k `lite`, +$1/1k per result above 10 (https://exa.ai/pricing, https://tpc.exa.ai/blog/solution-recommendation/rate-limits-latency-and-pricing-at-scale-picking-a-web-search-api-for-your-llm).
  - **Rejected alternative: Tavily.** $8/1k across every tier (https://getmux.io/guides/exa-pricing-explained) — 2x Exa's price for a search that is being used as a company-discovery step, not a deep-research step.
  - **Rejected alternative: relying on the current default `web_search`.** It resolves to OpenAI's hosted search against the Bifrost/GLM gateway, which is unverified (see 1d) and, even if it works, is text-only with no structured company output.
  - **Key mechanics in eve:** because tarima's model is a *direct* OpenAI-compatible provider (not an AI Gateway model), the `provider` setting does not apply to it (`packages/eve/docs/concepts/built-in-tools.md:293`). Two honest options:
    1. Author `apps/web/agent/tools/web_search.ts` that overrides the framework slot with an **authored** `defineTool` calling Exa's `/search` API directly with `EXA_API_KEY`. This is the recommended path: it works regardless of the gateway, returns structured JSON (title, url, snippet, publish date), and the app's own `send_email`/approval policy still governs anything outbound. The eve docs explicitly sanction replacing a provider-managed tool with an authored implementation (`packages/eve/docs/concepts/built-in-tools.md:322-341`).
    2. Keep the native OpenAI search but name the provider so eve does not attach it (`packages/eve/docs/concepts/built-in-tools.md:322-333`) — this removes a silent failure mode.
  - **Cost/key:** EXA_API_KEY, free to obtain, $10/month credits covers ~1,400 `auto` searches.
- **Sponsors still need a contact step.** Web search gives company names and sites, not inboxes. Two options, pick one:
  - **Free/self-hosted: scrape the company's own site** for a published contact address, using the existing `web_fetch` (which already works, `packages/eve/dist/src/tools/provided/web-fetch.js`) or a new `fetch_contact_page` tool. Honest and keyless, but brittle.
  - **Paid: Exa's own contact enrichment** (email $0.02/contact, phone $0.07/contact per https://exa.ai/pricing) — one API, one key, already the search provider.
  - **Rejected alternative: Hunter.io / Clearbit / Apollo.** Separate keys, separate bills, and lead-list enrichment is not what a two-city beta needs; the honest "we found their site, not their inbox" answer is fine for beta and matches the repo's existing honesty rule.

### Step 3 — Give the agent the two write paths it needs (candidate intake and contact enrichment)

- Today the agent can read the board and update a status, but cannot *add* a candidate it found. That is why discovery, even if wired, would end in chat instead of in the product.
- **Add `add_candidate` (or extend `update_task`)** as an eve tool: creates an `entities` row (`projectId`, `name`, `contactEmail`, `goal`, `status`) — the same shape `apps/api/src/services/entities.ts` already creates for the REST/MCP path. Reuse `createEntity` so the row is byte-identical to one created over MCP.
- **Add `set_venue_contact`** to fill a missing contact by hand or from an enrichment pass; the frozen contract already has `venueContactRequestSchema` (`packages/contract/src/venue.ts:74`) with no server-side handler behind it.
- Keep both ungated in `apps/web/agent/approval.ts` (they are internal board writes, like `update_task`), and keep `send_*` gated. The gate design is already right.

### Step 4 — Ranking and dedup, once steps 1-3 land

- **Ranking by distance + fit:** store coordinates (step 1), then sort by haversine distance from the geocoded brief centre, then by capacity fit, then by "has a contact" (the board should surface actionable rows first). The deleted `curation.ts` already encoded the capacity rule: "capacity fits the headcount when both sides are known" and "price band is not filtered on: the research docs carry no measured prices" (`apps/api/src/services/curation.ts` pre-`255ad59`). Reuse that reasoning.
- **Dedup:** re-implement the deleted `upsertCandidates` logic — it handled the awkward case where a venue already exists under a different provider id by adopting the id onto the (city, name) row. Both unique indexes survive, so the schema is ready.
- **Sponsor/venue overlap:** one `domain` column on both `entities` and `venue_catalog`, and a rule that a sponsor with a venue domain is one company with two roles. Without it the same restaurant appears twice in a reply.

### Step 5 — Later upgrades, with the trigger conditions

| Upgrade | Trigger | Cost note |
|---|---|---|
| **Google Places API (New)** Text Search + Nearby Search | when a third/fourth city lands, or when the OSM path is too sparse for real venues, or when ratings/hours become a product requirement | Text/Nearby Search Pro: 5,000 free calls/month, then $32/1k; Geocoding 10,000 free then $5/1k; field mask decides the SKU tier (https://developers.google.com/maps/billing-and-pricing/pricing). Enterprise SKU needed for phone/website in the same mask. Needs billing-enabled key with IP restriction. |
| **Foursquare Places API** | when you need ratings/photos/tips/hours/popularity that OSM lacks, or when the Overture/FSQ dataset proves too sparse in ES | Pro: 500 free calls then $15/1k up to 100k calls; Premium (photos/tips/ratings) $18.75/1k (https://foursquare.com/pricing/). The V3 legacy endpoints were deprecated 2026-05-15 (https://docs.foursquare.com/developer/reference/upcoming-changes). |
| **FSQ OS Places / Overture Maps self-hosted** | when you want zero per-call cost and already run infra | Both datasets are free: FSQ OS Places is Apache 2.0, 100M+ POIs, monthly refresh (https://opensource.foursquare.com/os-places/); Overture places theme is CDLA Permissive 2.0 / Apache 2.0, queryable straight from S3 with DuckDB over a bbox (https://docs.overturemaps.org/guides/places/). You own the ingest, index, uptime and monthly re-ingest. For a SQLite-on-VPS shop this is a bigger lift than a Places API key, but it is the only zero-marginal-cost path and it sidesteps every per-call SKU. |

### What to explicitly NOT do

- Do not wire a public Nominatim endpoint as a first-class agent tool (its policy forbids exactly that usage pattern: https://operations.osmfoundation.org/policies/nominatim/).
- Do not call `overpass-api.de` from a live agent turn without caching and a custom `User-Agent`; since April 2026 the public instance 406s stock library user agents and bans retry loops (https://overpass.ch/guides/overpass-api-alternatives).
- Do not re-introduce `packages/llm` / `packages/chase` / `packages/engine`. The eve runtime plus `apps/web/agent/tools/` plus `apps/api/src/services/` covers the same ground with less surface. The deleted packages' only unique value was the brief parser and outreach drafter, and both are now the model's job through eve.
- Do not treat `packages/contract/src/venue.ts` as the wire format for the new tool until it regains a geo dimension; today `catalogVenueSchema` has no coordinates, no rating, no hours.

### Cost summary for the recommended path

| Item | Key needed | Money |
|---|---|---|
| Photon discovery (public instance, low volume) | none | $0 (self-host ~95 GB disk + 64 GB RAM if needed) |
| Overpass enrichment (self-hosted country extract, or overpass.ch free tier) | none / optional paid key | $0 (self-host) to $0 (10k req/mo free tier) to $19/mo (Overspan 50k req/mo) |
| Exa search for sponsors | `EXA_API_KEY` | $0 within the $10/month free credits (~$1,400 `auto` searches) |
| Google Places (deferred) | billing-enabled Google Cloud key | $0 within 5,000 free calls/month, then $32/1k |

---

## Appendix: how this was verified

- Read the live agent surface: `apps/web/agent/{agent.ts,approval.ts,instructions.md,runtime.ts}`, `apps/web/agent/tools/*`, `apps/web/agent/{channels,hooks,lib}`.
- Read the eve framework contract for `web_search`/`web_fetch` defaults and provider resolution: `packages/eve/docs/concepts/built-in-tools.md`, `packages/eve/docs/reference/agent-files.md`, `packages/eve/docs/concepts/project-structure.mdx`, `packages/eve/dist/src/{framework/sources/registry.js,tools/provided/web-search.js,tools/provided/web-fetch.js,harness/provider-tools.js,harness/model-profile.js,compiled/@ai-sdk/openai/index.js}`.
- Read the storage and API surface: `apps/api/src/db/{schema.ts,index.ts}`, `apps/api/drizzle/0006_venue_search.sql`, `apps/api/src/services/{tools.ts,projects.ts,entities.ts,scopes.ts}`, `apps/api/src/routes/mcp.ts`, `packages/contract/src/{venue.ts,index.ts}`, `apps/web/src/lib/api-handlers/{ui.ts,agent-turn.ts,capabilities.ts}`.
- Read the deleted code from git history: `git show c97e7a3^:packages/venuesearch/src/{types.ts,photon.ts,overpass.ts,providers.ts,cities.ts,photon.test.ts}`, `git show 255ad59^:apps/api/src/services/{venue-search.ts,venue-search.test.ts,curation.ts}`, `git show 255ad59^:apps/api/src/server.ts`, `git show c97e7a3^:packages/{chase,llm,api-keys}/src/*`.
- Traced provenance with `git log --diff-filter=D --name-only` and `git log --all --oneline -- <path>`.
- Checked for provider wiring with repo-wide greps for `photon|overpass|places|foursquare|mapbox|nominatim|exa|tavily|serp|yelp|duckduckgo|geocod` and for `search_cache`/`venueSearch*` readers.
- Provider facts and pricing were checked against primary sources: Google Maps Platform pricing and Places data fields, OSM Wiki Overpass API and the OSMF Nominatim policy, komoot/photon (README + discussion #598), Foursquare pricing and the upcoming-changes notice, FSQ OS Places and Overture Maps docs, Exa pricing and billing docs, LocationIQ and geocode.maps.co pricing tables.
- No source file was modified; `git status --short` is clean.
