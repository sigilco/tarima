# Week-1 execution — the frozen offer + dual-city sprint (Oct 6–12)

2026-10-04. Iterates on `05_poc_plan_v2.md` after Quim's latest direction. Three inputs changed:

1. **Founder-market-fit answered**: both founders ran recurring community events — Quim in Málaga, cofounder in SF. We *were* the customer; our own organiser networks are the first demand channel (warm, not cold-DM) on both sides.
2. **Málaga continuity partially answered**: Quim's organiser network is the async channel after ~Oct 25 — pick a city captain from it (below).
3. **Hard gate from Quim**: *"We won't proceed until we have a clear idea on what we're offering to customers (with room for changes in case they request us) and can get leads / active users / planned revenue."* → W1's job is to produce exactly those three evidence buckets, starting from a frozen offer.

How this maps to the earlier roast memos (`uno.md`, `dos.md`): the current plan already runs their playbook — Wizard-of-Oz manual service (founders man the agent loop), the WTP test via signatures (their "who pays $200/mo" → our signed deferred-fee commitments + venue LOIs), single-actor value (an organiser gets a slot without network effects), and behavioral kill gates. What was still missing was the frozen offer. This doc adds it.

---

## 1. The offer, frozen for W1 (Oct 6–12)

One paragraph per side. Say exactly this; don't improvise a third product in the room.

### To organisers (Pivot A — the wedge)

> **"We place your recurring event into an independent venue on its dead night — we find the slot, negotiate the terms, and manage the booking end to end. You send us your format and size; within 48h you get 3 venue options in your neighborhood with real terms (free room on min-spend, or flat hire). We handle confirmations, reminders, and day-of coordination. Cost: a flat booking fee per event — deferred during our pilot — or $0 on min-spend rooms you hit. Your RSVP/ticketing stays wherever it already is."**

- Price points to test (vary per booking to read the curve): **SF $40 / $55 / $75 · Málaga €10 / €20 / €25** (€3/head incumbent anchor → €25 is the soft ceiling; a signed refusal is data, not failure).
- What we are NOT: not a directory, not a lead list, not ticketing — we own the *slot* (the booking + terms), they keep Luma/Meetup/Eventbrite for attendees.

### To venues (Pivot B — the P&L)

> **"We bring you a pre-booked, confirmed group on a night you're empty — a community event, 15–30 people buying food and drinks. You keep 100% of the till; the organiser side pays us, not you. After the event we show you exactly what the night made. If you'd want this pipeline running continuously, we ask you to sign a one-page letter saying you'd subscribe (~$149/mo SF / ~€99/mo ES) when it launches — the letter is how we prove the model to investors; nothing is collected now."**

- Venue asks: real slot windows + house terms into the schema on the spot (that IS the pivot-B inventory). Price probe on min-spend appetite, not abstract interest.
- The LOI is only pitched *after* a run event or a concrete committed booking — never cold. Cold LOIs are soft-yeses in disguise.

### The change protocol (Quim's "room for changes")

The offer is frozen for the week so evidence is comparable. Customer-requested changes are captured, not forked:

- Every counter-offer, refusal-reason, or "would you do X instead" → logged as `change_request` on the venue/organiser record (add field in Airtable, 15 seconds per entry).
- No mid-week offer edits. Sunday Oct 12 batch-review: if **≥3 independent parties push the same change**, offer v2 ships Monday Oct 13 and the changelog is written into the doc. That's how "customers asked for it" becomes YC evidence instead of anecdote.

---

## 2. W1 sprint plan (Oct 6–12)

Output targets for the week, mapped to Quim's three buckets:

| Bucket | W1 target (combined) |
|---|---|
| **Leads** | ≥15 venues with real slots in the registry (SF ≥9, Málaga ≥6); ≥30 organiser conversations (SF ≥18, Málaga ≥12, warm+verified channels count) |
| **Active users** | ≥3 events *booked* (signed slot agreements); ≥1 event *run* by Sunday |
| **Planned revenue** | ≥2 signed deferred-fee commitments at real price points; ≥1 venue LOI conversation seeded (not yet asked to sign); price-sensitivity spread (≥1 ask at top of ladder) |

### SF — cofounder (full loop)

| Day | Actions |
|---|---|
| Mon 6 | Message **10 warm organiser contacts from own network** (format+size → "3 options in 48h"); Mission walk-ins 5 venues (Valencia/16th–24th). Airtable live before first message. |
| Tue 7 | Hayes–Divisadero walk-ins 5; deliver 3-option offers to first warm replies; first slot agreements out for signature. |
| Wed 8 | Mission walk-ins 5; organiser follow-ups + second warm batch (10 more — own network + CSV prospects); confirm first booking for Thu/Fri. |
| Thu 9 | Hayes walk-ins 4; **first event runs** (target: smallest warm booking — a weeknight group that just needs a room); day-of checklist, capture till question for owner. |
| Fri 10 | Deferred-fee signature on event #2 booking; post-event venue debrief (till lift? re-offer? LOI seed). |
| Sat–Sun | Funnel counts + change_request log review; Sunday: offer-v2 decision with Quim. |

Notes: SF Tech Week (Oct 5–12) inflates founder/tech event counts — log but don't extrapolate. Founders-networking organisers already pay for rooms — highest fee tolerance, top of ladder ($75) goes to them first.

### Málaga — Quim (supply + warm-demand, ~3 weeks left on the ground)

| Day | Actions |
|---|---|
| Mon 6 | **Organiser network activation day** — 12 warm messages to own event-builder network (WhatsApp/ES-first): the organiser offer verbatim + "¿te encajo el próximo?" You don't need cold channels; you ARE the channel. |
| Tue 7 | Centro walk-in loop (Tier-1: Bakkano 2.0, Sala Premier, Garrison's, El Colmao, O'Hara, Bartola, Museum Pub) — slots + min-spend appetite into schema. |
| Wed 8 | Second Centro/Huelin batch (Recyclo, Kima, La Madriguera, Camden Lock, specialty-coffee row); deliver 3-option offers to warm replies. |
| Thu 9 | Attend Tándem Thu @ Sala Premier or Mundo Lingo @ Bakkano — recruit organisers in person; push for one booked slot wk2. |
| Fri 10 | Slot agreements out; aim ≥1 signed with deferred-fee line (test €20 mid-ladder). |
| Sat–Sun | Same funnel + change_request review; shortlist 2–3 candidates for city captain (below). |

### Both founders

- 15 min/day: funnel counts into metrics sheet — `contacted → replied → slots_offered → booked → ran → fee_signed`. No prose, numbers only.
- Every booking: deferred-fee signature at a *different* price point (fill the ladder).
- Log every "would you do X" as `change_request` — Sunday's review is where offer-v2 comes from.

---

## 3. Málaga async-continuity design (resolves the open owner question)

Quim's organiser network = the post-Oct-25 channel. Design for it now, name the person by Oct 24:

- **City captain**: 1 trusted organiser-friend keeps the slot registry warm — re-confirms `last_confirmed_at` on ~15 venues monthly, flags new organisers, in exchange for priority slots for their own events + a named-cofounder-level thank you in the deck (not a paid role — visa/entity posture applies to *our* money, but keep it clean: reciprocity, not cash).
- **Supply auto-rot guard**: the falsifier is venues going cold unprodded — captain's only real job is the monthly re-confirm WhatsApp to each venue (script provided, 20 min/month).
- **Demand async**: bookings from Málaga organisers continue venue↔organiser direct settlement — we broker terms remotely; the captain optionally attends first events as our eyes.
- Backup: if no captain materializes by Oct 24, Málaga gracefully degrades to the original plan — a banked supply map + a portability paragraph in the app. Not a failure, a scoping.

---

## 4. What NOT to do this week

- **Don't build software.** No booking flow, no endpoint (that's W2), no landing page. The Airtable registry + WhatsApp/DM + the one-page slot agreement IS the product this week.
- **Don't touch money.** No deposits through us, no Stripe links in our name, no invoicing — venue↔organiser settle directly (F-1 + no-entity posture, `08_payment_free_poc.md`).
- **Don't pitch the venue LOI cold** — only after a run event or committed booking.
- **Don't add formats outside the permit-free set** (social formats, groups <50, no live entertainment — SF Entertainment Commission).
- **Don't spread to new neighborhoods** (Marina, Soho, Teatinos, East Bay — all real, all not this week).
- **Don't fork the offer mid-week** — log changes, decide Sunday.

---

## 5. Where W1 lands in the Nov 2 application (the countdown)

| Date | Milestone |
|---|---|
| Sun Oct 12 | W1 verdict: offer v2 decision; ≥3 bookings + ≥2 fee signatures = green to run W2–3 as planned |
| Oct 13–19 | First events run; agent-assist on matching/comms + read-only `GET /venues` endpoint live (the "agent-callable" artifact); first venue LOI asks after lifts |
| Oct 20–24 | Rebooking test (the anti-leakage gate); till-lift numbers; Málaga captain named + supply handed off; **Oct 24 behavioral gates verdict** |
| Oct 26–Nov 1 | Both founders in SF: 3+ more events, application written from the scoreboard, 1-min video, submit by Nov 1 |
| Nov 2 | YC W27 deadline |

The app's traction paragraph writes itself from five W1–W3 numbers: events run · signed fee commitments (+ at which prices) · venue LOIs · observed direct settlements · rebookings through the registry. Everything else is narrative.

---

## 6. Open decisions checklist (updated)

- [x] ~~Founder-market-fit sentence~~ → **resolved**: "Both of us ran recurring community events — Quim in Málaga, [cofounder] in SF. We were the customer; our first 60 organiser conversations are our own networks." (Confirm exact wording for the app.)
- [ ] Malaga city captain — shortlist by Oct 12, name by Oct 24 (from Quim's organiser network)
- [ ] 1-hour immigration-attorney consult for cofounder before the SF trip — still open, book this week
- [x] ~~Application framing~~ → fees = wedge, venue subscription = business, availability API = option (confirmed `00_README.md`)
