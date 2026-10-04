# Venue-Platform POC — master doc index & synthesis

Consolidated plan for the dual-city POC (SF + Malaga) ahead of the YC W27 application (deadline Nov 2). Built 2026-10-04.

## Reading order

1. `event_market_data_pack.html` — the pitch-ready interactive data pack (open in a browser; tabs per city)
2. `01_scope.md` — the solidified scope: venue-pays B2B primary frame, A as default GTM, B separable, agent-led ops core on all variants
3. `07_pivot_variants.md` — A/B/C kept as standalone tracks: each variant's payer, artifact, agent role, risk, kill criteria
4. `adversarial_*.md` — three hostile reviews (investor [agent], customers, market structure) — read before believing anything else in here
5. `05_poc_plan_v2.md` — the revised plan after grilling + direction update, with data folded in: SF full-loop primary, Malaga half-scope replication, venue-WTP co-primary gate
6. `03_ops_kit.md` — the Airtable schema (= the pivot-B seed), scripts EN/ES, metrics definitions
7. `04_onepager_template.md` — the venue-facing pitch artifact template
8. `06_pitch_angles.md` — which numbers go to which audience
9. `data_pack_sf.md` / `data_pack_malaga.md` — full market distributions with method+confidence labels
10. `prospects_*.csv` — 33 SF + 31 Malaga named recurring organisers with contact channels
11. `venue_candidates_*.md` — named venue hit lists (14 warm + 9 candidate Malaga; 14 Mission + 8 Hayes SF)

## The thesis in one paragraph (post-grill)

A B2B demand-visibility platform for independent venues: venues pay a subscription to be seen and booked by recurring organisers and agents. The transaction rail is the wedge — organisers book dead weeknight hours through the platform with deposit-backed fees settled through us on every event (the anti-leakage piece the graveyard never had), producing the measured till lift the venue subscription is then sold against. Every event runs under agent-led management end to end — the concierge loop is an agent, not a founder — and the same structured availability data is agent-callable via API, which is the option on the machine layer. Venue marketplaces died selling *to* low-frequency supply; we sell visibility *for* venues once events have proven their Tuesday is worth something — and pivots A (organiser-first) and B (agent-native availability API) stay separable tracks (`07_pivot_variants.md`) so repositioning never costs a rebuild.

## The three things that must be true for this to be a company

1. **Anti-leakage works**: organiser books event #2 through the platform because the deposit/min-spend/settlement rail only exists through us — not because they're being nice.
2. **Venue supply stays warm unprodded**: slots re-offered within 30 days without re-selling (the schema's `last_confirmed_at` tracks rot).
3. **Venue-pays pull exists**: ≥2 venues commit to paying for visibility (€/$79–199/mo) after seeing a lift — the venue subscription is the P&L; the fee rail alone tops out ~€1M/yr and partners know it.

## What the POC actually is

A 3-week concierge run (Oct 6–24) instrumented like a product: Airtable schema as the data model, payment links as the rail, WhatsApp/DM as the interface. SF runs the full loop (cofounder). Malaga runs a supply-side smoke test + async demand via verified channels only — because Malaga is unmanned after ~Oct 25 and the datapair is confounded anyway; its job is supply-willingness evidence and a portability paragraph, not a controlled experiment.

## Decisions still open (need Quim)

- [ ] Founder-market-fit sentence for the app (any events/hospitality/community history on either founder?)
- [ ] Confirm application framing: wedge(fees)→business(venue subscription)→option(availability API)
- [ ] Malaga post-Oct-25 owner: who keeps the supply map warm async?
- [ ] First-event money rail: Stripe Payment Links vs Bizum for Malaga deposits
