# Solidified Scope — "Off-peak booking layer for independent venues"

v1 post-adversarial, post-direction update (2026-10-04). Synthesizes the narrowed thesis (restaurants/cafés, off-peak events) with Pivot A (organiser-first GTM) and Pivot B (agent-native availability architecture). **A and B are also kept as standalone pivot tracks** — see `07_pivot_variants.md`.

## The product in one sentence

**Venue-pays B2B availability/visibility platform — that IS pivot B**: venues pay to have their dead hours visible, bookable, and attributable to recurring organisers and agents; pivot A (organiser-pays booking) is the GTM wedge that bootstraps the inventory and proves the lift. Every event runs under agent-led management end to end.

## The two pivots as products (kept separate)

- **A — organiser-pays booking**: recurring organisers book structured venue slots; they pay per booking (deferred-fee during POC). It's the wedge: produces events, produces till lifts, produces the evidence B is sold against.
- **B — venue-pays visibility**: venues pay a subscription (€79–149/mo ES / $99–199 SF) for placement in the organiser/agent demand feed, the "what your Tuesday is worth" dashboard, revenue attribution — i.e., **for visibility of their availability to demand**, human and machine. The machine-readable/agent-callable API is the same product seen by machine demand (the "sustainable for agents" angle, YC's AI-into-physical-world theme).

The merged default: A's transactions bootstrap B's supply and generate the lift B sells against. But each stands alone — if POC data says only venues pay, or only organisers pay, the other pivot is the product (see `07_pivot_variants.md`).

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

## Payment-free POC posture (legal constraint, not product choice)

No Spanish entity (SL = ~€3k + weeks) + US cofounder on an F-1 visa (no employment/self-employment, no holding customer funds) → **the POC holds no customer money**. Design in `08_payment_free_poc.md`: we broker terms, organiser settles venue directly, and WTP is measured via signed deferred-fee commitments + venue visibility LOIs. Anti-leakage becomes slot-lock (recurring slot lives in our registry) instead of money-lock during POC. The money rail is written, turns on with the entity.

## Explicit non-goals (v1)

- Art displays, cross-business collaborations, offices, general "venue optimization" — cut.
- The "actions/insights recommender" — it's a Phase-2 upsell artifact for venue subscribers, not a product.
- B2C anything — cut from the application entirely.
- Selling software to venues before transactions exist — Phase 2, only after they've seen money land.

## Monetization (venue-pays B2B = pivot B; organiser fee = pivot A mechanics)

- **Pivot B — the P&L**: venue visibility subscription, €79–149/mo ES / $99–199/mo SF per location — placement in organiser/agent demand, actions dashboard, attribution. POC-validated via signed LOIs (no collection); *sold* against a measured lift.
- **Pivot A — the mechanics**: organiser per-event fee (€20–25 Málaga / $40–75 SF) or % of tickets + deposit/min-spend settlement. During POC: deferred-fee signature, money settles venue↔organiser directly.
- **Phase 3**: performance pricing on lift + API/booking fees on machine-originated demand.

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
