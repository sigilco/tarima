# Dual-City POC — SF + Malaga (draft for adversarial review)

2026-10-04. Runs Oct 6–24 (both cities parallel), then joint SF week Oct 26–Nov 2. YC W27 deadline Nov 2.

## Framing

Two cities are not focus-splitting; they are a designed falsification pair. SF = deepest organiser demand + deepest incumbent supply-side competition. Malaga = thin organised demand + almost no venue-booking supply-side competition. Same playbook, same metrics, opposite market conditions → the result tells us *which* market this is a product for, not just *whether* it works.

| | SF (cofounder) | Malaga (Quim, until ~Oct 25) |
|---|---|---|
| Demand profile | Dense: Luma's home market, tech/founder meetups, AI demos, run clubs | Thin: expat/nomad meetups, language exchanges, university, some tech |
| Competition for venue booking | Peerspace/Tagvenue/Giggster HQ'd/dense here; venues pitched constantly | No dominant venue marketplace; manual Facebook/WhatsApp negotiation |
| Venue economics | High cost, sophisticated owners, strict rules | Cheap, informal, owner-present, flexible |
| What it tests | Does organiser-first survive where venues have alternatives? | Does the model work where we must hand-create both sides? |

## Shared infrastructure (built once, week 0)

- **Airtable/Notion back office** with two tables:
  - `venues` — *this is the Pivot-B schema*: name, neighborhood, capacity, slot windows (day × hours), house rules, price terms (free / min-spend €X / flat €Y), contact, status. Machine-readable by construction — no prose fields where a structured field works.
  - `organisers` — name, event format, recurrence, typical group size, platform found on, fee reaction, status.
- **Shared metrics sheet** — the kill criteria tracked identically in both cities: contacts → replies → soft-yes → slot-offered → booked → ran → paid. Per-event: group size, venue F&B take, our fee.
- **Localized outreach scripts** — same skeleton, localized (EN/ES; SF organiser DM vs Malaga venue walk-in).

## Track A — supply (venues), per city

- Target: 40 venue contacts/city, walk-in + owner-hours calls (15–17h is dead time for cafés in ES; mornings for US).
- Initial neighborhood hypotheses (data pack validates/adjusts):
  - SF: Mission, Hayes Valley, SoMa, Marina, Richmond — pick 2 by event-density data.
  - Malaga: Centro Histórico, Soho, La Merced — pick 2 (Teatinos = student-dense but venue-poor; El Palo/Pedregalejo = beach, seasonal).
- Pitch (venue): "We bring you a prepaid/pre-booked group on a night you're empty. You keep 100% of F&B. The organiser pays us, not you. Yes/no — and which slots?"
- Collect into the schema: actual slot windows + house rules + price terms. A venue that won't state terms isn't a yes.

## Track B — demand (organisers), per city

- Target: 60 organiser contacts/city, sourced from the data pack's recurring-organiser prospect list (Luma, Meetup, Eventbrite, Facebook groups, Internations for Malaga).
- Offer: "We have venues with open [Tue/Wed] slots, some free-to-you on a min-spend, booked in one message. Want a slot for your next event?"
- Fee test ladder: free booking → $/€25 flat → $/€50 flat / min-spend contract. Record where each organiser drops off.
- Green: ≥12 commit to a date, ≥5 accept paying.

## Track C — willingness to pay (the dashboard mock)

- One-pager per venue: "Your Tuesday 19–22h hosted a 30-person language exchange — est. €450 bar take. 3 more formats fit this room." Show to yes-venues in week 3.
- Also functions as the pitch artifact built FROM the data pack (real neighborhood numbers, not hypotheticals).

## Timeline

| Dates | Track | Gate |
|---|---|---|
| Oct 4–5 | Data pack lands → pick 2 neighborhoods + top 3 event formats per city; build hit lists + CRM | Hit lists finalized |
| Oct 6–12 | Wk1: 20 venues + 30 organisers per city | Daily count; first soft-yeses |
| Oct 13–19 | Wk2: remaining contacts; first bookings made; run 1–2 events/city | First fee collected |
| Oct 20–24 | Wk3: more events; WTP mock shown; bank Malaga results | **Oct 24: per-city go/red verdict** |
| Oct 26–Nov 2 | Joint SF: scale winning city, run 3+ events, draft application from numbers | Submit Nov 1 |

## Decision rules (Oct 24)

- Both green → SF primary (market size, cofounder, YC story); Malaga = portability proof in the app.
- One green → run the winner; the red city's failure mode becomes a design input.
- Both red → pivot C (Spain private-dining SaaS) decision with the user; no application by Nov 2.

## What the data pack must answer (per city)

1. Neighborhood × share of public events (last 90d) → where to walk in.
2. Event-type mix → which formats to recruit organisers from.
3. Day-of-week + start-hour distributions → the off-peak demand map.
4. Venue types used today → who we're displacing/augmenting.
5. Group-size distribution → venue capacity matching.
6. 20–30 named recurring organisers w/ handles → Track B prospect list.
7. Candidate venue archetypes + starter list → Track A hit list.

## Open questions handed to adversarial review

- 40+60 contacts in 3 weeks per founder — realistic alongside event execution?
- Is Oct 24 too early to bank Malaga, given user leaves ~Oct 25 — should Malaga Track B continue async?
- Single shared CRM vs per-city — does SF's market data (prices in $, different norms) corrupt the shared schema?
- Should the POC *charge real money* in week 2 or prove booking volume first?
