# Pivot variants — A / B / C kept as separate tracks

Quim's direction (2026-10-04, clarified same day): pivots A and B stay **separable** — each is a standalone product, not only ingredients of the merged scope. **"Venues pay for visibility" IS pivot B** — not a third variant: the venue's subscription buys visibility of its availability to demand (organiser feed now, agents/API later). Two constraints apply to every variant:

1. **The payer differs by pivot**: A = organiser pays per booking; B = venue pays the visibility subscription; C = venue pays SaaS fee (the most literal B2B). The merged default runs A's transactions to bootstrap B's supply and generate the lift B is sold against.
2. **Agent-led event management is retained on either pivot**: matching, term negotiation, confirmations, reminders, day-of coordination, post-event till collection run as an agent (founders manning it manually during the POC, but the interface is built agent-first — structured schema, script-shaped prompts, agent-callable endpoint). This is both the ops-scale answer and the "sustainable for humans and agents" condition made literal.
3. **POC is payment-free** (`08_payment_free_poc.md`): no ES entity + F-1 visa → zero customer money through founders/platform. Venue↔organiser settle directly; WTP measured by signed deferred-fee commitments + venue LOIs.

---

## Variant A — organiser-first marketplace (the default wedge)

- **Who pays who**: organiser pays per booking (deposit/fee rail); venue pays the B2B subscription for visibility + attribution once events land.
- **Core artifact**: the organiser workspace + structured venue index.
- **Agent-led management**: the agent runs organiser→venue matching, term negotiation (min-spend/flat), confirmations, reminders, post-event settlement + till collection. Humans only do supply acquisition (walk-ins).
- **Why it's the default**: transactions exist on day 1 without selling anything to venues first; generates the demand data the venue subscription sells back.
- **Risk carried**: recurrence leakage (solved by the money rail), organiser-fee TAM ceiling (~€1M/yr — acceptable because the venue subscription is the P&L).
- **Kill/falsify**: zero organiser rebookings through the rail; no venue converts to paying visibility after events.

## Variant B — venue-pays availability/visibility platform (the "venues pay for visibility" pivot)

- **Who pays who**: venues pay a subscription for visibility of their availability to demand — placement in the organiser/agent feed, the actions dashboard, revenue attribution. The machine-readable API is the *same visibility* exposed to machine demand (AI planners, copilots, Luma-style tools); API/booking fees on machine-originated bookings come later.
- **Core artifact**: the structured availability layer — venue records (slots, terms, capacity, `last_confirmed_at`) + booking API (`GET /venues?day=tue&capacity=30` → slots + terms → `POST /bookings`) + the visibility surface (feed/dashboard/attribution).
- **Agent-led management**: the agent IS the product's ops — a venue's agent handles inquiries, quotes terms, confirms, settles; organiser-side agents call the same API. Humans only onboard venues.
- **When it becomes the main bet**: the POC's co-primary gate answers this directly — ≥2 venues sign/pay for visibility after seeing a lift means B is real now, not later; if organisers won't pay but venues will, B becomes the front door.
- **Risk carried**: a venue that hasn't seen money land pays for nothing (subscription sold only against lift); standards/API demand is slow — mitigated because B's supply and proof come from A's transactions.
- **Kill/falsify**: venues take free events but nobody signs a visibility commitment after a lift; venues won't maintain stated terms; no agent/planner demand channel materializes post-POC.

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
