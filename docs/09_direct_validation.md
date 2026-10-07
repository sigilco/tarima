# Direct validation — the fastest path to a B2B answer

Quim's question (2026-10-04/06): most direct way to validate the venue-pays B2B idea, without building the "agent for corporate events" product.

## First, the correction — confirmed

The corporate-events agent is a **different product with a different buyer**: office managers/EAs/planners, longer sales cycle, procurement + security review, and a real build (voice agent, calendar/booking integrations, venue inventory in the loop). TTV is weeks–months and the buyer isn't the venue owner at all. It's a future demand channel into pivot B (planner-side agents calling the availability API), not the validation path.

One nuance worth keeping: "agent-led management" in our scope is **ops plumbing, not a voice agent** — founders-behind-the-schema running match→confirm→run→settle with scripts. Nothing to build to validate.

## The riskiest assumption of pivot B

**"A venue will pay ~€/$79–199/mo for a demand pipeline it didn't ask for."** Everything else (organiser demand exists, dead hours exist, formats fit) is already data-backed. So the direct test is: get a venue a filled dead-hour event, measure lift, ask for the commitment. Evidence ladder:

1. Paid pilot — strongest, but unavailable during payment-free POC (no ES entity, F-1)
2. **Signed LOI at a real price** (€79–149 / $99–199) — the co-primary gate; this is the test
3. Behavioral proxy — venues that already self-program dead hours (Bakkano 2.0, trivia bars, venues paying promoters) have already paid for the outcome with effort — they're the warm cohort

## The 2–3 week direct test (per city, no product)

0. **Demand canary first (2–3 days, free):** post verified slot offers to the organiser channels in `prospects_*.csv` (33 SF + 31 Málaga named organisers). If organisers jump on real slots, demand is proven *before* you need venues. If not, no venue pitch saves it — stop or fix the offer.
1. **Pitch the B2B offer verbatim to the warmest 10–15 venues** — prioritize event-friendly ones (they already host anything = proven intent): "We fill your Tuesday 19:00–22:00 with a pre-booked group of 15–30. First event free. If it works, it's €99/mo." — walk-ins (Málaga Centro loop / SF Mission corridor), WhatsApp-first in Spain.
2. **Deliver 1–2 events concierge-style.** No build: Airtable schema + WhatsApp + founders running the agent loop manually. Match an organiser from the list to a venue slot, broker terms (min-spend/private-party), attend to witness.
3. **Measure + ask.** Owner-quoted till lift ("your Tuesday made €X") → then the LOI: "If this pipeline ran continuously, would you subscribe at €99/mo for placement + attribution?" Binary answer per venue — that signature IS the validation.
4. **Rebooking probe:** does the organiser come back through the registry for event #2? (slot-lock retention — the leakage test.)

## What it validates vs. what it doesn't

- **Validates:** venue pain is real, the price point, the pitch itself, organiser demand, the deal mechanics.
- **Doesn't validate (post-POC questions — say so):** supply acquisition at scale (walk-ins don't scale — that's a sales problem, not a product problem), churn/retention on the subscription, agent-layer unit economics.

## Skip until the LOIs exist

No app, no payments (see `08_payment_free_poc.md`), no calendar/booking integrations, no voice agent, no self-serve organiser onboarding, no corporate-events anything.

## Ordering by speed

Organiser demand canary (days, free) → venue pitch (days) → concierge event (1–2 wks incl. scheduling) → LOI ask (same day as the lift). A B-decision in ~2–3 weeks, well inside the Nov 2 deadline.
