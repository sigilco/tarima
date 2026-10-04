# Solidified Scope — "Off-peak booking layer for independent venues"

v0 draft for adversarial review. Synthesizes the narrowed thesis (restaurants/cafés, off-peak events) with Pivot A (organiser-first GTM) and Pivot B (agent-native availability architecture). 2026-10-04.

## The product in one sentence

Recurring event organisers book independent venues' dead hours through us — we own the slot, the terms, and the payment; venue availability is structured data from day one, bookable by humans and callable by agents.

## Who does what

- **Paying customer: the recurring organiser.** Book clubs, language exchanges, tech/founder meetups, supper clubs, run-club socials, board-game nights, life-drawing, workshops. They have a weekly/monthly room need, are already trained to pay platform fees (Luma 5%, Eventbrite ~6.6%+$1.79, Meetup $29.99–55/mo), and are reachable via the platforms where they already list.
- **Supply: independent restaurants, cafés, bars.** Mon–Thu evenings especially. They pay €0/$0. Their return: a pre-booked group that buys F&B on a night they were empty. Venue-booking marketplaces died selling *to* venues (Splacer, Eventup); we sell *for* them and charge the other side.
- **We own the transaction**: the booking — slot window, house terms (free room / min-spend / flat hire), confirmation, deposit or payment. Not a directory, not a lead list. Luma and Meetup are demand *sources* (where we find organisers), not infrastructure.

## Why A + B together and not separately

- A alone = a manual concierge: works, never scales, no moat.
- B alone = a standards/API company: needs a design partner, slow, nothing for a venue or organiser to do on day 1.
- **A as GTM + B as architecture**: every venue onboards as a structured availability record (slot windows, capacity, rules, price terms) — the same canonical schema that makes the booking API agent-callable later. The marketplace generates the transaction volume that makes the API worth calling. AI event planners (Nowadays YC S23, corporate planner copilots, Luma-style tools) are a future *demand* channel into that API — the "sustainable for agents" angle, made literal, sitting in YC's "AI into the physical world" theme — without betting the company on standards adoption this quarter.

## Explicit non-goals (v1)

- Art displays, cross-business collaborations, offices, general "venue optimization" — cut.
- The "actions/insights recommender" — it's a Phase-2 upsell artifact for venue subscribers, not a product.
- B2C anything — cut from the application entirely.
- Selling software to venues before transactions exist — Phase 2, only after they've seen money land.

## Monetization (from memo §4, unchanged)

- **Phase 1 (now):** organiser-pays booking fee — flat per confirmed slot (€20–50 / $40–75 est., calibrate per city) or % of ticket revenue; optional venue min-spend contract instead of cash fee. Venue pays 0.
- **Phase 2:** venue "Priority" subscription €79–149/mo/location (guaranteed feed placement, calendar sync, revenue attribution) — only offered to venues that have hosted ≥1 event.
- **Phase 3:** performance pricing on measured lift — roadmap slide, not a launch price.

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
