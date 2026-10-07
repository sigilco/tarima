# Test plan A — venue-pays B2B (the "venue app" assumption)

## What we're testing

**Core assumption:** an independent venue (restaurant/café/bar) will pay €79–149/mo (Málaga) / $99–199/mo (SF) for **visibility of its availability to event demand** — feed placement, attribution, the "what your Tuesday is worth" view.

Sub-assumptions, each independently falsifiable:
1. Venues actually have dead hours they *want* filled (some are full, some don't care)
2. The pitch converts at walk-in/DM — an owner says yes to a first event within one conversation
3. A booked group produces a **measurable till lift** attributable to us
4. After seeing lift, the venue signs a paying-intent commitment (LOI) at a real price — not just "sure, send me info"
5. Supply stays warm unprodded (venue re-offers slots within 30 days)

## What we need to do

Zero-build — Airtable schema + WhatsApp/DM + the existing artifacts:

1. **Demand canary first (2–3 days):** post verified slot offers to the organiser prospect lists (33 SF + 31 Málaga, `prospects_*.csv`). If organisers don't jump on real slots, stop — venue pitch can't rescue dead demand.
2. **Warmest-venue shortlist (10–15/city):** prioritize venues already self-programming dead hours (Bakkano 2.0, trivia pubs, Recyclo in Málaga; Mission/Hayes cafés-bars on `venue_candidates_*.md`) — they've already paid for the outcome with effort.
3. **Pitch verbatim** at the door (Málaga: WhatsApp-first, ES) — first event free, subscription priced after.
4. **Deliver 1–2 concierge events** — founders run the agent loop manually (match organiser → terms → confirm → run). Private-party framing, organiser→venue direct settlement.
5. **Measure + LOI ask** the same day the lift lands.

## How to pitch it (verbatim)

> "We fill your Tuesday 19:00–22:00 with a pre-booked group of 15–30 — language exchanges, book clubs, meetups that buy drinks and food. First event is free, no commitment. If it makes your Tuesday worth €X, it's €99/mo to keep the pipeline — placement + proof of what each event brought."

Arm it with the data pack: neighborhood event density, day×hour overlap, the €3/head Málaga anchor / SF min-spend norms. One-pager in `04_onepager_template.md` + scripts in `03_ops_kit.md`.

## Outcomes to look out for

**Green (per city):** pitch→yes ≥25–30% of warm venues; ≥1 event ran with owner-quoted till lift; **≥2 signed visibility LOIs at stated price** (the gate); venue re-offers slots unprodded; organiser rebooks through the registry.
**Red:** venues take free events but won't sign (outcome real, product wrong — keep concierge fee model instead); "we're full anyway" (dead-hours pain absent → shrink to segment that has it, e.g. new cafés); lift unmeasurable (attribution problem — fix measurement, not pitch); owners want public-event formats (permit/liability — out of POC scope).
**Ambiguous — decide fast:** yeses but slow scheduling (logistics friction, not demand), interest only at €0 (WTP falsified → pivot A fee-led or C).

## Feedback loop (asap)

- **Log every interaction same-day** in Airtable: pitch verbatim used, objection (verbatim), price reaction at each number tested (€79/99/149), outcome. The objection corpus IS the product spec.
- **48h funnel review** each week: contacted→replied→soft-yes→slots→event→lift→LOI; any stage <expected → change ONE variable (offer, segment, neighborhood, price) next batch — never two at once or you can't attribute.
- **Gate check Oct 24:** green criteria → pivot B is the app; red pattern → `07_pivot_variants.md` tells you which pivot the data points to.
- Every finding lands in `06_pitch_angles.md` (what the numbers let you claim) before the application is written.
