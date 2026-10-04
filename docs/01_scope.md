# Solidified Scope — "Off-peak booking layer for independent venues"

v1 post-adversarial, post-direction update (2026-10-04). Synthesizes the narrowed thesis (restaurants/cafés, off-peak events) with Pivot A (organiser-first GTM) and Pivot B (agent-native availability architecture). **A and B are also kept as standalone pivot tracks** — see `07_pivot_variants.md`.

## The product in one sentence

**B2B demand-visibility platform for independent venues**: venues pay a subscription to be seen and booked by recurring event organisers and agents; we own the booking transaction (slot, terms, deposit/settlement rail) that makes the visibility real — and every event runs under agent-led management end to end.

## The three layers (all present from day 1, revealed in order)

1. **Transaction rail** — the organiser-facing booking: slot + house terms (free/min-spend/flat) + deposit escrow + settlement. It's the wedge: produces events, produces till lifts, produces the evidence the subscription is sold against. Organiser pays the per-event fee here.
2. **The business — venue visibility subscription** (€79–149/mo ES / $99–199 SF per location): placement in the organiser/agent demand feed, the "what your Tuesday is worth" actions dashboard, revenue attribution, calendar sync. Sold only against a measured lift — never before money lands (the honest tension documented in `07_pivot_variants.md`).
3. **The option — machine-readable availability API**: the same schema exposed agent-first (`GET /venues?day=tue&capacity=30`, `POST /bookings`). Demand channels for it: AI planners (Nowadays YC S23), copilots, other organisers' agents.

## Who does what

- **Paying customer: the recurring organiser.** Book clubs, language exchanges, tech/founder meetups, supper clubs, run-club socials, board-game nights, life-drawing, workshops. They have a weekly/monthly room need, are already trained to pay platform fees (Luma 5%, Eventbrite ~6.6%+$1.79, Meetup $29.99–55/mo), and are reachable via the platforms where they already list.
- **Supply: independent restaurants, cafés, bars.** Mon–Thu evenings especially. They pay €0/$0. Their return: a pre-booked group that buys F&B on a night they were empty. Venue-booking marketplaces died selling *to* venues (Splacer, Eventup); we sell *for* them and charge the other side.
- **We own the transaction**: the booking — slot window, house terms (free room / min-spend / flat hire), confirmation, deposit or payment. Not a directory, not a lead list. Luma and Meetup are demand *sources* (where we find organisers), not infrastructure.

## Why A + B together — and why they also stay separate

- A alone = a manual concierge: works, never scales, no moat.
- B alone = a standards/API company: needs a design partner, slow, nothing to do on day 1.
- **Default path**: A as GTM + B as architecture (marketplace volume makes the API worth calling).
- **But the pivots remain separable** (`07_pivot_variants.md`): if POC data says organisers won't pay but venues will (B2B-only reality), or that machine/agent demand outruns human organisers, A and B each stand alone — the schema, rail, and agent-led ops layer are identical in both, so switching the front door costs a repositioning, not a rebuild.

## Agent-led event management (retained on every variant)

The concierge is an agent, not a founder: match → negotiate terms → confirm → remind → run → settle → collect outcomes, all run against the structured schema. During the POC founders man the loop manually (scripts = the agent's future prompts); the deliverable by week 2 is the loop running with agent-assist on real events and the read-only endpoint live. This is the YC "AI into the physical world" angle made literal — and it's also the ops answer to "walk-in sales doesn't scale": agent-run demand-side ops scales even where supply acquisition doesn't.

## Explicit non-goals (v1)

- Art displays, cross-business collaborations, offices, general "venue optimization" — cut.
- The "actions/insights recommender" — it's a Phase-2 upsell artifact for venue subscribers, not a product.
- B2C anything — cut from the application entirely.
- Selling software to venues before transactions exist — Phase 2, only after they've seen money land.

## Monetization (venue-pays B2B primary — updated per direction)

- **The P&L: venue visibility subscription** — €79–149/mo ES / $99–199/mo SF per location: demand-feed placement, actions dashboard, attribution, calendar sync. Positioned as the product from day 1 of the pitch ("we fill your dead hours and prove it"); *sold* only after a measured lift exists.
- **The mechanics: organiser per-event fee + deposit/settlement rail** — flat per booking (€20–25 Málaga / $40–75 SF, data-calibrated) or % of tickets; deposit escrow + min-spend settlement keeps money flowing through the platform on every event (the anti-leakage primitive).
- **Phase 3:** performance pricing on measured lift + API/booking fees on machine-originated demand — roadmap, not launch.

## The one KPI per side

- Venue: incremental F&B € per dead hour (ask for the till number after each event).
- Organiser: total cost per event (fee + hassle) vs their alternatives (free café hunting, Peerspace ~20%, empty bar negotiation).
- Platform: take per booking × bookings/week/city → path to covering founder-hours.

## Kill criteria (per city, pre-committed)

- Supply: ≥15/40 venues give soft-yes with named contact + real slots. Red: <8.
- Demand: ≥12/60 organisers commit to a date; ≥5 accept paying a fee or signing min-spend. Red: "yes but only free".
- Both red in both cities → pivot C (private-dining SaaS, Spain) or stop.

## What must be true (assumptions the POC tests)

1. Organisers will pay a per-booking fee to skip venue-hunting.
2. Independent venues will hand off-peak control to a third party that brings prepaid groups.
3. Recurring organisers exist in sufficient density outside SF (Malaga) to matter.
4. The structured-availability schema is cheap enough to maintain manually at <50 venues.
5. SF's incumbent density doesn't freeze us out (venues there get pitched constantly).

## Open questions for the adversarial pass

- Is running two cities at idea stage focus-splitting or cheap falsification?
- Is the SF market actually hostile (Peerspace home turf) or does organiser-first sidestep venue marketplaces entirely?
- Min-spend enforcement mechanics — how does a café actually collect on "€300 min spend"?
- Ticketing flow: do we touch organiser→attendee money, or only organiser→venue/platform money?
- Insurance/liability/permits: what does a hosted third-party event trigger in CA vs ES?
