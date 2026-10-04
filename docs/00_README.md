# Venue-Platform POC — master doc index & synthesis

Consolidated plan for the dual-city POC (SF + Malaga) ahead of the YC W27 application (deadline Nov 2). Built 2026-10-04.

## Reading order

1. `event_market_data_pack.html` — the pitch-ready interactive data pack (open in a browser; tabs per city)
2. `09_week1_execution.md` — **start here**: the frozen offer per side + the Oct 6–12 dual-city sprint, evidence buckets (leads/active users/planned revenue), Málaga continuity design
3. `01_scope.md` — the solidified scope: venue-pays B2B primary frame, A as default GTM, B separable, agent-led ops core on all variants
4. `07_pivot_variants.md` — A/B/C kept as standalone tracks: each variant's payer, artifact, agent role, risk, kill criteria (B = the venue-pays-for-visibility product)
5. `08_payment_free_poc.md` — the payment-free POC design: no customer money through founders (no ES entity + F-1 visa), direct venue↔organiser settlement, deferred-fee signatures + venue LOIs as the WTP evidence
6. `adversarial_*.md` — three hostile reviews (investor [agent], customers, market structure) — read before believing anything else in here
7. `05_poc_plan_v2.md` — the revised plan after grilling + direction update, with data folded in: SF full-loop primary, Malaga half-scope replication, venue-WTP co-primary gate
8. `03_ops_kit.md` — the Airtable schema (= the pivot-B seed), scripts EN/ES, metrics definitions
9. `04_onepager_template.md` — the venue-facing pitch artifact template
10. `06_pitch_angles.md` — which numbers go to which audience
11. `data_pack_sf.md` / `data_pack_malaga.md` — full market distributions with method+confidence labels
12. `prospects_*.csv` — 33 SF + 31 Malaga named recurring organisers with contact channels
13. `venue_candidates_*.md` — named venue hit lists (14 warm + 9 candidate Malaga; 14 Mission + 8 Hayes SF)

## The thesis in one paragraph (post-grill)

Pivot B is the product: venues pay a subscription for **visibility of their availability** to demand — placement in the organiser feed now, the agent-callable API for machine demand (AI planners, copilots) later. Pivot A is the wedge: recurring organisers book dead weeknight hours through us, and those transactions produce the measured till lift the venue subscription is then sold against. Every event runs under agent-led management end to end — the concierge loop is an agent, not a founder. During the POC no customer money touches the founders (no ES entity, F-1 visa): we broker terms, venue↔organiser settle directly, and willingness-to-pay is measured by signed deferred-fee commitments and venue visibility LOIs — the capital-free version of the rail the graveyard never had. The pivots stay separable (`07_pivot_variants.md`), so repositioning never costs a rebuild.

## The three things that must be true for this to be a company

1. **Anti-leakage works**: organiser books event #2 through the registry because the recurring slot + terms only exist there (slot-lock during POC; the money rail drops in post-incorporation) — not because they're being nice.
2. **Venue supply stays warm unprodded**: slots re-offered within 30 days without re-selling (the schema's `last_confirmed_at` tracks rot).
3. **Venue-pays pull exists**: ≥2 venues commit to paying for visibility (€/$79–199/mo) after seeing a lift — the venue subscription is the P&L; the fee rail alone tops out ~€1M/yr and partners know it.

## What the POC actually is

A 3-week concierge run (Oct 6–24) instrumented like a product: Airtable schema as the data model, payment links as the rail, WhatsApp/DM as the interface. SF runs the full loop (cofounder). Malaga runs a supply-side smoke test + async demand via verified channels only — because Malaga is unmanned after ~Oct 25 and the datapair is confounded anyway; its job is supply-willingness evidence and a portability paragraph, not a controlled experiment.

## Decisions still open (need Quim)

- [x] ~~Founder-market-fit sentence~~ → resolved in `09_week1_execution.md` §6: both founders ran recurring community events (Quim Málaga, cofounder SF); own networks are the first demand channel — confirm exact wording for the app
- [x] ~~Confirm application framing~~ → wedge(fees)→business(venue subscription)→option(availability API)
- [ ] Malaga post-Oct-25 owner → narrowed: pick a "city captain" from Quim's organiser network; shortlist by Oct 12, name by Oct 24 (`09_week1_execution.md` §3)
- [x] ~~First-event money rail~~ → resolved by `08_payment_free_poc.md`: no money through founders during POC; venue↔organiser settle directly; WTP via signed deferred-fee commitments
- [ ] 1-hour immigration-attorney consult for the cofounder before the SF trip (F-1 posture: unpaid validation only)
