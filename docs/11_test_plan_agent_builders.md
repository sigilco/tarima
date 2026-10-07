# Test plan B — agent for event builders (organiser-side agent pivot)

## What we're testing

**Core assumption:** a recurring event organiser (meetup host, book club, language-exchange lead, supper club, games night) will **delegate venue-finding + event logistics to an agent and pay for it** — per-event fee (€/$20–40) or small subscription.

This is NOT the corporate-events-agent product (different buyer, procurement, voice-agent build). The buyer here is the community organiser who already runs events and whose #1 friction is finding a room + running logistics. Sub-assumptions:
1. The friction is real and felt weekly — "where do we meet" is their actual problem, not just a stated one
2. They'll *delegate* it — organiser control-anxiety is the real competitor, not Peerspace's price
3. An agent run by founders-behind-the-schema holds quality: no event breaks, terms get honored
4. WTP exists independent of the venue-covered min-spend (they pay *us*, not just accept a deal)

## What we need to do

Founders-as-agent — the same agent-led loop, but the organiser is the customer:

1. **Recruit 10–20 organisers/city** from `prospects_*.csv` (verified contact channels only) + the founders' own communities — first demand channel is the people who already know you.
2. **Offer the service as a product-shaped concierge:** "Tell me your format, size, and dates. I find the room, cut the deal, run confirmations + day-of. You just show up." Intake = WhatsApp/email; backend = the Airtable schema + scripts. No voice agent, no app.
3. **Run 3–5 events** where the agent does everything except what requires a human body (negotiation via DM, confirmations, reminders, settlement witnessing).
4. **Price-test on real bookings:** deferred-fee line in the slot agreement — vary €20/30/40 per event; also probe a €30–50/mo "unlimited bookings" tier for weekly organisers.
5. **Delegation probe:** after event 1, ask them to book event 2 entirely through the agent — do they actually hand it over?

## How to pitch it (verbatim)

> "Finding a room is the worst part of running your thing. Give me your format and dates — I find the venue, negotiate the terms, handle confirmations and the day-of. First one is on us; after that it's €25/event or €40/mo. You just show up and host."

Anchor against what they already pay: Luma 5%, Eventbrite ~6.6%+$1.79, Meetup $29.99–55/mo — the fee is inside their existing spend, not new money.

## Outcomes to look out for

**Green:** ≥30–40% of contacted organisers accept a trial; ≥2 rebook through the agent unprompted; deferred-fee signatures at €20+ hold; organiser describes the delegation, not the deal, as the value ("I didn't think about the venue at all"); zero botched events.
**Red:** organisers prefer the free DM-to-venue channel (delegation isn't worth paying for); they accept the brokered deal but refuse any platform fee (WTP falsified — venue-side is the only payer → strengthens pivot B); control anxiety — they want to pick the venue themselves (agent becomes a search tool, not a service → different product); agent errors break an event (ops doesn't hold at concierge quality → trust never forms).
**Ambiguous:** they love it but won't pay (delight ≠ WTP — don't count); they want ticketing/public events (out of scope for POC, note and move on).

## Feedback loop (asap)

- **Instrument the agent loop itself:** every request, match, term negotiation, failure logged — the log is both the metrics and the spec for what to automate first.
- **Post-event 3-question debrief** (same day): would you use it again? what did you not have to do? what would you pay? Log verbatim answers.
- **Shared weekly review with Plan A:** organiser findings feed venue pitch (demand proof) and vice versa; kill/keep rules same date (Oct 24).
- **Decision output:** green → the agent is a product to build after the entity exists (real fees + automation of the logged loop); red → keep the loop as internal ops for pivot B only.
