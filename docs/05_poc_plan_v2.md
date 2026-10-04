# Dual-City POC v2 — SF primary + Malaga replication (post-adversarial revision)

2026-10-04. Incorporates investor grill + customer grill + market-structure findings. {DATA} fields fill when the data packs land.

## What changed vs the draft and why

| Change | Source |
|---|---|
| Malaga demoted to half-scope replication: Track A (venue supply) fully, Track B (organiser demand) async/at-home-events only. SF runs the full loop. | Investor: the pair is confounded (6 variables), Malaga is unmanned after ~Oct 25, founder-hours are scarcer than the datapair's value |
| Kill criteria → behavioral (events run, rebookings, fees collected, till lift), soft-yeses demoted to pacing metrics | Investor: soft-yeses greenlight false positives |
| Fee model: **per-event fee always + money flows through platform every event** (deposit escrow / min-spend settlement), not first-match-only | Customer grill + investor: recurrence disintermediates you; no money flow = no defense |
| Application framing: Phase-1 fees = supply-acquisition subsidy; venue Priority subscription is the business; availability API is the option | Investor: honest fee TAM ~€1M/yr ceiling |
| Format filter: social formats only (meetups, language exchange, book club, supper club*, games, run-club social, networking). No live entertainment/DJ/comedy; SF groups <50 | Market grill: SF Entertainment Commission permit + Place-of-Assembly threshold; keeps POC permit-free |
| Organiser prospect list must include a **verified contact channel** per name (postable group, email, mutual) — not just a platform handle | Investor: Luma has no cold-DM surface; Malaga channels are FB/Internations/WhatsApp |
| Fallback if channel gate fails: founders physically attend 2–3 events week 1 and recruit organisers in person | Investor |
| Venue reactivation falsifier added; `slots.last_confirmed_at` field added to schema | Investor: supply-side warmth is the graveyard's actual cause of death |
| Week-2 build: read-only JSON endpoint over the venues table → "agent-callable" literally true in the demo | Investor: narrative can't outrun the artifact |
| WTP one-pager moved to week 2 (tests the actual business earlier) | Investor |
| Malaga ops = WhatsApp-first, Spanish-first; pricing €15–30 flat or % take (auto-scales vs SF $40–75) | Customer grill: €200-event economics; owner answers WhatsApp when she feels like it |
| **Venue-pays B2B = pivot B**: venues buy visibility of their availability (feed placement + actions dashboard + attribution) — the subscription is pivot B's product, not a third variant. Venue WTP is a co-primary gate, moved to week 2 | Quim direction 10-04 (clarified) + investor (subscription is the business) |
| **Pivots A/B stay separable** (`07_pivot_variants.md`): same schema + rail + agent-led ops in every variant — repositioning, not rebuild | Quim direction 10-04 |
| **Agent-led management is the ops core** in all variants: match→negotiate→confirm→run→settle→collect as an agent loop; founders man it manually during POC, week-2 deliverable = loop with agent-assist on real events + read-only JSON endpoint | Quim direction 10-04 + investor (agent-callable must be literally true) |
| **POC is payment-free** (`08_payment_free_poc.md`): no ES entity + F-1 visa → zero customer money through founders/platform. We broker terms; organiser settles venue directly; WTP measured via signed deferred-fee commitments + venue visibility LOIs. Anti-leakage becomes slot-lock (recurring slot lives in our registry) during POC | Quim 10-04 legal constraint |

## Roles (independent tracks)

- **Cofounder (SF) — full loop:** Track A + B + C. 40 venues, 60 organisers, run events, collect fees. Target neighborhoods: **Mission (Valencia/16th–24th) + Hayes Valley–Divisadero corridor** (Marina/Cow Hollow alternate). Priority organiser formats: **founder/business networking (most fee-tolerant), language exchanges, games/trivia, book clubs/writing socials, food socials** — venue-compatible social formats ≈44% of SF Meetup listings.
- **Quim (Malaga, until ~Oct 25) — supply smoke test:** 40 venue walk-ins in **Centro Histórico (primary, ~55–65% of sampled recurring-event venues) + Huelin (secondary, ~25% — beats the Soho hypothesis)**; capture real slots + terms into the schema; hand-test min-spend appetite ("¿te viene bien consumición mínima de X€?"). One ~90-min Centro walk covers Tier-1 warm leads (Bakkano 2.0, Sala Premier, Garrison's, El Colmao, O'Hara, Bartola, Museum Pub) + Tier-2 candidates (Recyclo — advertises event hosting, Kima, La Madriguera, Camden Lock, specialty-coffee row). Demand side: verified-channel organisers async + attend 1–2 events in person (Tándem Thu @ Sala Premier, Mundo Lingo Tue @ Bakkano).
- **Post-Oct 25:** Malaga continues only via already-made contacts (async); both founders in SF for the events push + application.

## Behavioral kill criteria (the real gates)

Green by ~Oct 24:
- ≥5 completed events across ≥4 venues (SF weighted)
- ≥2 organiser rebookings **through the platform** (the leakage test — booking #2 is what proves the model)
- **≥3 signed deferred-fee commitments** (payment-free POC: signatures, not collections — vary €10/20/25–30 to read price sensitivity)
- **≥1 observed direct settlement** (organiser→venue deposit or min-spend honored on the night — validates the deal structure without us in the money)
- ≥1 venue requests another event unprodded; ≥30% of yes-venues re-offer slots within 30 days
- ≥1 measured till lift quoted by the owner ("you made my Tuesday worth €X")
- **≥2 signed venue visibility LOIs** (pivot-B gate — the venue-pays model is the P&L)

Red: events run but zero rebookings through the registry (slot-lock fails → leakage confirmed; pitch adjusts), no organiser signs any deferred-fee commitment (demand falsified → pivot C decision), or venues take events but nobody signs a visibility LOI after a lift (pivot-B frame falsified → whole model is pivot-A fee-led or pivot C).

## Agent-led event management (the ops core, retained on every pivot)

The concierge loop — match organiser↔venue/slot → negotiate terms → confirm → remind → run → settle (deposit/min-spend) → collect till outcome — is designed as an **agent loop**, not founder chores. POC implementation: founders run it manually with the ops-kit scripts (which double as the agent's future prompts), everything logged against the schema; by week 2 the matching + comms run with agent-assist on real bookings and the read-only endpoint (`GET /venues?day=tue&capacity=30`) is live so "agent-callable" is literally true. Same loop in pivots A, B, and C — in B it IS the product.

## Money mechanics — payment-free POC (`08_payment_free_poc.md`)

**Legal constraint drives the design**: no Spanish entity (SL = ~€3k + weeks) and the US cofounder is on an F-1 student visa (no employment/self-employment, no holding customer funds). During POC: **money never flows through founders or the platform** — we broker, venues and organisers settle directly.

1. **We broker, they settle.** We write slot terms (min-spend / deposit / flat hire) in a one-page slot agreement signed venue↔organiser; deposit = organiser prepays the venue (Bizum/cash/card terminal), min-spend = venue's bar tab. We're the introducer, not a money party. Deal structure validated by ≥1 observed settlement on the night.
2. **Anti-leakage = slot-lock during POC.** The recurring slot, negotiated terms, and rebooking window exist only in our registry; booking #2 through us is how the organiser *keeps* the slot. Weaker than money-lock — flagged honestly — free to test; the money rail drops in post-incorporation with no redesign.
3. **WTP = signed deferred-fee commitments.** Every slot agreement carries: *"Service fee to platform: €X per booking — payable upon launch (deferred during pilot)."* Signed-acceptance rate = the WTP signal; vary €10/20/25–30 for price sensitivity. Zero euros collected.
4. **Venue-side LOI for pivot B.** After any event with visible lift: venue signs *"If this pipeline ran continuously, I'd subscribe at €X–Y/mo for placement + attribution."* ≥2 signed = the co-primary gate.
5. Liability: all POC events run as private-party bookings inside the venue's normal operations — no public door tickets, no advertised "ticketed event" framing, no live entertainment formats. Supper clubs = private reservations only.
6. **F-1 posture (SF track)**: unpaid research/validation only — no personal invoicing, no money held, no employment relationships. 1-hour immigration-attorney consult before the SF trip (not legal advice).
7. YC framing: *"We ran the POC capital-free on purpose — pre-incorporation we couldn't hold money, so we measured signed commitments + LOIs plus real events settling venue↔organiser. The money rail is written; it turns on with the entity."*

## Week-by-week

| Week | SF (cofounder) | Malaga (Quim) |
|---|---|---|
| **W0 Oct 4–5** | Data pack lands → finalize 2 neighborhoods + formats + hit lists; Airtable up (schema + `last_confirmed_at`); localized scripts | same |
| **W1 Oct 6–12** | 20 venue walk-ins (Mission 14 + Hayes 8 corridor list) + 30 organiser contacts; daily funnel counts; first slot offers. ⚠️ SF Tech Week Oct 5–12 inflates tech/founder counts — don't extrapolate that week | 20 venue walk-ins (Centro loop + Huelin); async organiser outreach via verified channels only; attend Tándem Thu @ Sala Premier or Mundo Lingo Tue @ Bakkano to recruit |
| **W2 Oct 13–19** | Remaining contacts; first 2–3 events booked + run; first signed deferred-fee commitments + observed direct settlements; venue visibility LOI shown to interested venues; JSON endpoint built | Remaining 20 walk-ins; demand contacts async; bank supply map |
| **W3 Oct 20–24** | More events; rebooking test live; till lifts measured | Wrap Malaga: final slot confirmations; hand off to async contacts |
| **Oct 24** | **Behavioral gates verdict** (SF primary, Malaga as supply-side datapoint) | same |
| **Oct 26–Nov 1** | Joint SF: 3+ more events, application written from numbers (wedge→subscription→API framing), 1-min video, submit Nov 1 | |

## Data findings folded in

### Malaga (from data pack)
- **Neighborhoods:** Centro Histórico (~55–65% of recurring-event venues) + Huelin (~25%). Soho folds into Centro outreach; Teatinos venue-poor, El Palo seasonal.
- **Demand shape:** ~35–55 recurring venue events/week citywide, **~20–30 in the Mon–Thu 19:00–22:30 dead-hour window**. Thursday is the peak community night (~10–12 events), not Friday.
- **Formats:** language exchange/intl social dominant (~11 identified organisers), games/quiz ~5, dance schools (very high session count), tech ~7 but mostly monthly; supper-club/workshop layer nearly absent.
- **Price anchor:** de-facto hosted-slot price = €3/head cover or 1-drink minimum → fee ladder €20–25 flat is easy, €50 needs min-spend framing.
- **Proof-of-model venue:** Bakkano 2.0 self-programs Mon Beer Pong / Tue Mundo Lingo / Wed Intl Party / Thu Game Zone and closes Sunday — the entire thesis already running in one bar. Cite in the YC application.
- **Organiser pool:** 31 named (CSV), ~10 running weekly venue-hosted formats; Meetup primary + InterNations + Couchsurfing + Telegram/WhatsApp; **Luma ≈ zero presence**; FB Expats 106K members but uncountable without login.
- **Market size honesty:** ~1/10–1/20 SF's density — viable for concierge POC, thin for platform story.

### SF (from data pack — counted corpus: 1,717 Meetup + 76 Luma + 4,293 Eventbrite, Oct 4–Nov 4 window)
- **Neighborhoods:** Mission #1 (18.6% Meetup SF, 25% of Mon–Thu evening events); FiDi/SoMa leads ticketed platforms but wrong venue economics (chains/corporate); Hayes Valley–Divisadero = #2 pick (19 Meetup + 6 Luma + 24 Eventbrite, dense indie stock, venues already taking organiser bookings).
- **Demand shape:** Mon–Thu = 46% of listed events; **~260 events/month run Mon–Thu 17–22h in SF alone** (~60/night on a dead Tuesday); Wed/Thu strongest weeknights; starts peak 18–19h.
- **The killer stat: 21% of Meetup events (365/1,717) list NO VENUE** — one in five organisers has an event without a home. That IS the pitch.
- **Venue behavior already exists:** 40% of Mon–Thu evening events already happen in F&B venues (85 bars + 10 restaurants + 6 cafés) — we're formalizing, not inventing. Cafés are the unserved supply (2% of evening events — they close before 17h).
- **Group size:** community mass 5–35 attendees — pitch "15–30 prepaid guests," not 100-person events. Meetup RSVP undercounts ~1.5–3×.
- **Organiser pool:** 33 named in CSV (pre-qualified — several already meet in cafés/bars); 70 Meetup groups ran ≥3 events, 134 ran ≥2 in-window.
- **Formats:** social 16.3%, run-club/fitness 13.4%, founder/biz 12.6%, arts 12.2%, food 7.5%, language 7.3%, games 5.4% (tech 4.1% — Tech-Week-inflated window Oct 5–12, flag it).
- **Platforms:** SF = Luma's #1 global market (76 discover events vs NYC 52); Meetup GraphQL enumerable; Eventbrite 4,293 listed.
- **East Bay = 21% of metro events** (Oakland 161 + Berkeley 98) — a real second market, not this POC.
- **Fee calibration:** founders-networking organisers already pay for rooms (rotate Hawthorn/Lush Lounge/Amelie); SF fee ladder $40–75 flat or % of tickets; min-spend compatible.

## Answers pending from Quim

- Founder-market fit sentence (events/hospitality/community background?) → shapes the app's first paragraph
- Confirm fee framing for application: fees-as-wedge, subscription-as-business
- Malaga contacts to hand off to post-Oct 25?
