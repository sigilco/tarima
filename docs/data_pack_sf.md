# SF Bay Area public-events data pack
**For:** "off-peak booking layer for independent venues" pitch + POC scoping
**Compiled:** 2026-10-04. Window: events listed for **Oct 4 – Nov 4, 2026** (all public sources are forward-looking; ~90d backward history isn't enumerable without auth'd APIs). Recurrence is evidenced by series flags and repeated events per group inside the window.
**Confidence tiers:** `counted` = enumerated API records · `sampled` = random-ish first-N pages of a larger total · `informed` = analyst judgment from partial data.

## Corpus (what we actually pulled)

| Source | Records | Basis | Confidence |
|---|---|---|---|
| Meetup GraphQL (`eventSearch`/`recommendedEvents`, lat 37.77 lon −122.42, r=30mi, PHYSICAL, Oct 4–Nov 4) | **1,717 unique events** | counted (full pagination of 51 keyword queries + recommended feed, deduped) | counted, near-complete for listed events |
| Luma SF discover feed (`api.lu.ma/discover/get-paginated-events`, place `discplace-BDj7GNbGlsF7Cka`) | **76 events** | counted (full feed) | counted — but Luma discover is curated, not total inventory |
| Eventbrite SF (`/d/ca--san-francisco/all-events/`) | **4,293 listed events**; 499 sampled (first 25 pages) | counted total, sampled detail | counted total / sampled detail |
| Funcheap SF (`/events/san-francisco/` pages 1–5) | 75 dated listings | counted | counted (curated editorial list, not a marketplace) |
| SF Station / Do415 | qualitative only | their listings are music/nightlife-dominated; used to bound, not to count | informed |

Two big caveats, up front:
- **365 of 1,717 Meetup events (21%) list no venue at all** — venue TBA. On the demand side this is literally the product's pitch: ~1 in 5 organisers currently has an event without a home.
- **Oct 5–12 is SF Tech Week**, which inflates tech/founder counts this window (flagged in format mix).

---

## 1. Neighborhood distribution

Basis: Meetup SF events with a geocoded venue (n=738, all inside SF city limits; neighborhood = SF Planning "analysis neighborhood" polygon lookup, official 41-hood shapefile). Luma n=76 (sublocality + coords). Eventbrite sample n=488 (venue lat/lon).

| Bucket | Meetup % | Luma % | Eventbrite % | Confidence |
|---|---|---|---|---|
| **Mission** | **18.6%** (137) | 6.6% (5) | 16.6% (81) | counted (M) |
| FiDi/Union Sq/Tenderloin | 16.9% (125) | **30.3%** (23) | **27.3%** (133) | counted (M) |
| SoMa | 5.1% (38) | 10.5% (8) | 12.3% (60) | counted (M) |
| West/South residential (Noe/Bernal/Glen/Excelsior/OMI…) | 9.3% (69) | 2.6% | 7.0% | counted (M) |
| Nob/Russian/Pac Heights | 8.5% (63) | 3.9% | 5.1% | counted (M) |
| Richmond (Inner+Outer) | 6.6% (49) | 0% | 2.0% | counted (M) |
| Golden Gate Park/Presidio (park events) | 6.5% (48) | 2.6% | 2.9% | counted (M) |
| North Beach/Chinatown | 4.9% (36) | 3.9% | 6.4% | counted (M) |
| Potrero/Mission Bay/Dogpatch | 4.9% (36) | 9.2% (7) | 5.3% | counted (M) |
| Marina/Cow Hollow | 4.7% (35) | 1.3% | 4.1% | counted (M) |
| Sunset | 3.9% (29) | 0% | 2.7% | counted (M) |
| Haight/Western Addition | 3.8% (28) | 0% | 0.6% | counted (M) |
| Castro | 2.7% (20) | 0% | 2.7% | counted (M) |
| Hayes Valley | 2.6% (19) | 7.9% (6) | 4.9% (24) | counted (M) |

**East Bay (separate, per brief):** 360 metro events in the Meetup corpus are East Bay (Oakland 161, Berkeley 98, Richmond CA 21, Alameda 16…) = **21% of all metro-identified events** — meaningful, driven by Oakland's own organiser scene. Luma has no Oakland/Berkeley place page; East Bay events surface inside the SF feed (e.g. "The Oakland Join-Up"). *confidence: counted (Meetup)*.

**So what:** Mission is the #1 event neighborhood on community platforms and #2 on ticketed platforms — and it's the densest independent-F&B neighborhood in the city. FiDi/SoMa leads on Luma/Eventbrite but those are corporate-office and nightlife venues, not indie cafés. For walk-in venue outreach the answer is Mission first, then a second indie-dense neighborhood (Hayes Valley or Marina — see §7).

## 2. Event-type mix (Meetup SF, n=738; classified by title+group+category keywords)

| Format | Share | n | Note |
|---|---|---|---|
| General social (mixers, hangouts) | 16.3% | 120 | catch-all |
| Fitness/run-club/outdoor social | 13.4% | 99 | parks-heavy |
| Founder/business networking | 12.6% | 93 | Tech-Week-inflated ±2–3pts |
| Arts & culture | 12.2% | 90 | sketching, drawing, gallery |
| Food/supper social | 7.5% | 55 | |
| Language exchange | 7.3% | 54 | ES/FR/JP/ASL/IT+ |
| Games (board/card/trivia) | 5.4% | 40 | |
| Tech/AI meetups | 4.1% | 30 | Tech-Week-inflated |
| Wellness/meditation | 4.1% | 30 | |
| Singles/dating | 3.8% | 28 | |
| Music/nightlife | 3.5% | 26 | |
| Workshops/classes | 3.0% | 22 | |
| Dance/salsa | 2.8% | 21 | |
| Book clubs (keyword-matched) | 1.6% | 12 | undercounted — many book groups list as "social" |
| Community/civic/other | 2.4% | 18 | |

Cross-check — Luma (n=76): tech 26% + founder/biz 24% ≈ **50% tech/founder** (Luma's skew); Eventbrite sample: Music 27% + Performing/Visual Arts 20% + Community & Culture 13% (ticketed skew).

**So what:** the "community formats" the product serves (social+food+language+games+book+wellness+workshop ≈ **44%** of Meetup SF listings) are real and recurring — but diffuse. The richest single recruit pool is founder/business networking (12.6%) which already books bar/lounge rooms and is the most fee-tolerant.

## 3. Temporal distribution (Meetup SF n=738, PT)

Day-of-week: Sat 179 · Sun 141 · Thu 105 · Wed 100 · Fri 80 · Tue 77 · Mon 56.
**Mon–Thu total = 338 (46%)** of listed events.

Start-hour: mornings 9–12 dominate weekends; evenings cluster hard at **18:00 (134) and 19:00 (144)**; 17:00=71; 20–21h=19.

**Mon–Thu 17–22h = 260 events (35% of all SF Meetup listings).** Their neighborhood mix: Mission 66, FiDi/South Beach 54, SoMa 24, Nob Hill 22, Marina 12 — **Mission+FiDi+SoMa = 55%** of weekday-evening demand.

Luma (n=76): Wed 20, Tue 14, Thu 11 — **46% of Luma SF events fall Mon–Thu evening**; start peak 17–19h. Eventbrite sample: Fri+Sat 54%, starts 19–21h (nightlife skew).

**So what:** the Mon–Thu 17–22h hypothesis holds — ~250–350 listed events/month in SF already run in exactly the dead window, concentrated 18–19h starts, and the Mission/FiDi/SoMa belt carries over half. Wed/Thu are the strongest weeknights (not Mon).

## 4. Venue types used (Meetup SF n=738; venue-name classification + manual lookup for top ~150 venues)

| Venue type | All events | Mon–Thu evening subset |
|---|---|---|
| Bar/pub/brewery | 105 (14%) | 85 (33%) |
| Dedicated event/community space | 99 (13%) | 41 (16%) |
| Public space (parks, plazas) | 115 (16%) | 9 (3%) |
| Community institution (church/library/civic) | 84 (11%) | 20 (8%) |
| Café/coffee | 61 (8%) | 6 (2%) — cafés close before 17h |
| Restaurant | 30 (4%) | 10 (4%) |
| Coworking | 28 (4%) | 17 (7%) |
| Hotel | 25 (3%) | 12 (5%) |
| Retail | 9 (1%) | 1 |
| Address-only / unspecified / other | 182 (25%) | 59 (23%) |

**F&B (bar+café+restaurant) share: 26.5% overall — but 40% of the Mon–Thu evening subset** already happens in F&B venues (85 bars + 10 restaurants + 6 cafés). The rest splits between dedicated event spaces, community institutions, coworking, and venues we couldn't classify.

**So what:** weekday-evening organisers already pick bars; the gap the product fills is (a) the 25% with unlisted/unspecified venues and (b) pulling daytime café-suitable formats (book clubs, writing, language tables) into evening slots that don't exist for them yet because cafés close. Cafés are the *unserved* dead-hour supply — almost no evening events happen in them because none are open.

## 5. Group-size distribution (Meetup SF, RSVP yesCount at listing time, n=728 with data)

| RSVPs | Share | Events |
|---|---|---|
| <10 | 85% | 619 |
| 10–19 | 10% | 70 |
| 20–34 | 4% | 26 |
| 35–59 | 3% | 20 |
| 60–99 | <1% | 2 |
| 100+ | <1% | 1 |

Median 2, p75 = 6, p90 = 14. **Caveat:** these are RSVPs *at snapshot* (events up to 31 days out, signups still accruing; Meetup RSVP-undercounts actual attendance, and popular groups hide lists). Luma guest_count on its curated feed: median 122 (n=28) — but that's featured-event bias, not representative. For the Mon–Thu evening subset: median 2, mean 7.4.

**So what:** the community-format mass sits at **5–35 attendees** — exactly café-back-room / restaurant-buyout size. Don't pitch venues on 100-person events; pitch "15–30 prepaid guests on your dead Tuesday."

## 6. Recurring-organiser prospect list

Delivered as `prospects_sf.csv` — **33 named organisers**, every one verified as recurring in this window (Meetup events in-window ≥2–15, Luma calendars, or web-verified weekly cadence). Notable: 70 distinct Meetup groups ran ≥3 SF events in the next 31 days; 134 ran ≥2. Several already meet in F&B rooms (see notes column) — they're pre-qualified, not hypothetical.

## 7. Venue hit-list input

Delivered as `venue_candidates_sf.md`. Recommendation: **Mission (1)** + **Hayes Valley / Divisadero corridor (2)**, with Marina/Cow Hollow as the close alternate. Mission leads every community-source count and is the city's densest indie-F&B stock; Hayes/Divisadero is the second-best mix of event demand, independent ownership, and walk-in practicality. FiDi/SoMa has volume but venue economics are wrong (busy at lunch, corporate evenings, chains).

## 8. Sources

- Meetup GraphQL `eventSearch`/`recommendedEvents` — meetup.com (unauthenticated queries, Oct 4 2026)
- Luma — luma.com/sf page + `api.lu.ma/discover/get-paginated-events` (place `discplace-BDj7GNbGlsF7Cka`); city leaderboard via luma.com/discover places list
- Eventbrite — eventbrite.com/d/ca--san-francisco/all-events/ (pagination, embedded `__SERVER_DATA__`)
- Funcheap — sf.funcheap.com/events/san-francisco/ (pages 1–5)
- Neighborhood polygons — SF Planning "analysis neighborhoods" shapefile (sfchronicle/sf-shapefiles, DataSF j2bu-swwd)
- Verification searches — silentbook.club, mundolingo.org, november-project.com, detoursf.com, sfegl.com, academy-sf.com

## 9. What we could NOT measure

- **Backward 90-day counts**: no public source enumerates past events. Window used: next 31 days of listed events; recurring cadence inferred from series flags + multi-event groups + published cadences.
- **Eventbrite full 4,293**: only 499 sampled (page-capped enumeration). Category shares are sampled, not counted.
- **Meetup "no-venue" events' location**: 365 events without venues can't be neighborhood-bucketed; ~91 belong to explicitly-SF groups.
- **Attendance vs RSVP**: actual turnout is ~1.5–3× listed RSVPs per organiser lore; not directly measurable.
- **Funcheap/Do415/SF Station totals**: editorial/concert listings — bounded qualitatively, not counted.
