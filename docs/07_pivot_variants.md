# Pivot variants — A / B / C kept as separate tracks

Quim's direction (2026-10-04): pivots A and B stay **separable** — each is a standalone product direction, not only ingredients of the merged scope. Two constraints apply to every variant:

1. **Primary frame is venue-pays B2B**: venues/F&B pay a fee for **visibility** — placement in the demand feed, the actions dashboard, revenue attribution. The P&L is the venue subscription; transactions are the on-ramp that proves the value being sold.
2. **Agent-led event management is retained on either pivot**: matching, term negotiation, confirmations, reminders, day-of coordination, post-event till collection run as an agent (founders manning it manually during the POC, but the interface is built agent-first — structured schema, script-shaped prompts, agent-callable endpoint). This is both the ops-scale answer and the "sustainable for humans and agents" condition made literal.

---

## Variant A — organiser-first marketplace (the default wedge)

- **Who pays who**: organiser pays per booking (deposit/fee rail); venue pays the B2B subscription for visibility + attribution once events land.
- **Core artifact**: the organiser workspace + structured venue index.
- **Agent-led management**: the agent runs organiser→venue matching, term negotiation (min-spend/flat), confirmations, reminders, post-event settlement + till collection. Humans only do supply acquisition (walk-ins).
- **Why it's the default**: transactions exist on day 1 without selling anything to venues first; generates the demand data the venue subscription sells back.
- **Risk carried**: recurrence leakage (solved by the money rail), organiser-fee TAM ceiling (~€1M/yr — acceptable because the venue subscription is the P&L).
- **Kill/falsify**: zero organiser rebookings through the rail; no venue converts to paying visibility after events.

## Variant B — agent-native venue availability layer

- **Who pays who**: venues pay for distribution of their availability (the same visibility subscription, aimed at agent/machine demand channels: AI planners, corporate copilots, Luma-style tools); API/booking fees on machine-originated bookings later.
- **Core artifact**: the machine-readable availability standard + booking API (`GET /venues?day=tue&capacity=30` → slots + terms → `POST /bookings`).
- **Agent-led management**: the agent IS the product — a venue's agent handles inquiries, quotes terms, confirms, collects deposits; organiser-side agents call the same API. Humans only onboard venues.
- **When it becomes the main bet**: if POC shows venues don't care about dead hours but organisers/planners desperately want machine-readable rooms — or once variant A generates enough live inventory that the API is worth calling.
- **Risk carried**: standards businesses are slow and need design partners; the fix is to keep it downstream of real transaction volume (it's the same schema as A's index, just exposed).
- **Kill/falsify**: no planner/agent channel calls it within 60 days of having ≥30 live venues; venues won't maintain stated terms.

## Variant C — Spain private-dining SaaS (safety net)

- **Who pays who**: venues pay €99–199/mo/location for an event-inquiry pipeline + management tool (visibility-as-lead-gen, the most literal version of "venues pay for visibility").
- **Core artifact**: inquiry-generation + event-management SaaS for restaurants; agent-led management handles the inquiry→booking→execution workflow end to end.
- **When**: both cities fail the organiser-demand test. Most boring, most proven (private events ≈15% of restaurant revenue); US incumbents (Tripleseat, Perfect Venue) don't cover Spain well.
- **Risk**: least differentiated, smallest story; it's the fallback, not the ambition.

## What stays identical across variants

- The venue record schema (slots, terms, capacity, `last_confirmed_at`) — it IS variant B's resource model used inside A and C.
- The money rail (deposit escrow + min-spend settlement through the platform) — the anti-leakage primitive in A and C, the trust layer in B.
- The agent-led management loop — match → negotiate → confirm → run → settle → collect outcomes.
- The venue subscription = the business model; per-event fees/deposits = mechanics + on-ramp.

## The honest tension (kept visible, not resolved away)

"Venues pay for visibility" is the right P&L — **but** the adversarial finding stands: a venue that hasn't seen money land pays for nothing, and SMB churn on untried subscriptions is brutal. So the GTM order is fixed: transaction first (often free/subsidized), subscription sold *against the measured lift* ("your Tuesday made €450 — keep this pipeline for €99/mo"). The POC must produce that lift number or the B2B frame is a story without a product. This is why the venue WTP test is a co-primary gate in the plan, not a week-3 afterthought.
