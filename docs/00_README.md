# Venue-Platform POC — master doc index & synthesis

Consolidated plan for the dual-city POC (SF + Malaga) ahead of the YC W27 application (deadline Nov 2). Built 2026-10-04.

## Reading order

1. `event_market_data_pack.html` — the pitch-ready interactive data pack (open in a browser; tabs per city)
2. `01_scope.md` — the solidified A+B scope (organiser-first GTM + machine-readable availability architecture)
3. `adversarial_*.md` — three hostile reviews (investor [agent], customers, market structure) — read before believing anything else in here
4. `05_poc_plan_v2.md` — the revised plan after grilling, with data folded in: SF full-loop primary, Malaga half-scope replication
5. `03_ops_kit.md` — the Airtable schema (= the pivot-B seed), scripts EN/ES, metrics definitions
6. `04_onepager_template.md` — the venue-facing pitch artifact template
7. `06_pitch_angles.md` — which numbers go to which audience
8. `data_pack_sf.md` / `data_pack_malaga.md` — full market distributions with method+confidence labels
9. `prospects_*.csv` — 33 SF + 31 Malaga named recurring organisers with contact channels
10. `venue_candidates_*.md` — named venue hit lists (14 warm + 9 candidate Malaga; 14 Mission + 8 Hayes SF)

## The thesis in one paragraph (post-grill)

Recurring community-event organisers book independent venues' dead weeknight hours through us. The organiser pays a per-event fee (deposit-backed, settled by us); the venue pays nothing and keeps the F&B. The fee is the wedge, not the business — the business is the venue's Priority subscription once events have landed, and the option on the machine-readable availability layer that agents (and AI planners) will call. Venue marketplaces died selling *to* low-frequency supply; we sell *for* venues and charge the side with the recurring need — while keeping a money flow through the platform on every event, which is the piece the graveyard never had.

## The three things that must be true for this to be a company

1. **Anti-leakage works**: organiser books event #2 through the platform because the deposit/min-spend/settlement rail only exists through us — not because they're being nice.
2. **Venue supply stays warm unprodded**: slots re-offered within 30 days without re-selling (the schema's `last_confirmed_at` tracks rot).
3. **Phase-2 pull exists**: at least a few venues say "I'd pay monthly for this" at €79–149 — the fee business alone tops out ~€1M/yr and partners know it.

## What the POC actually is

A 3-week concierge run (Oct 6–24) instrumented like a product: Airtable schema as the data model, payment links as the rail, WhatsApp/DM as the interface. SF runs the full loop (cofounder). Malaga runs a supply-side smoke test + async demand via verified channels only — because Malaga is unmanned after ~Oct 25 and the datapair is confounded anyway; its job is supply-willingness evidence and a portability paragraph, not a controlled experiment.

## Decisions still open (need Quim)

- [ ] Founder-market-fit sentence for the app (any events/hospitality/community history on either founder?)
- [ ] Confirm application framing: wedge(fees)→business(venue subscription)→option(availability API)
- [ ] Malaga post-Oct-25 owner: who keeps the supply map warm async?
- [ ] First-event money rail: Stripe Payment Links vs Bizum for Malaga deposits
