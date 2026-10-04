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
| **Venue-pays B2B is the primary frame**: the product = venues buy demand visibility (feed placement + actions dashboard + attribution); organiser fees are transaction mechanics + on-ramp. Venue WTP is a co-primary gate, moved to week 2 | Quim direction 10-04 + investor (subscription is the business) |
| **Pivots A/B stay separable** (`07_pivot_variants.md`): same schema + rail + agent-led ops in every variant — repositioning, not rebuild | Quim direction 10-04 |
| **Agent-led management is the ops core** in all variants: match→negotiate→confirm→run→settle→collect as an agent loop; founders man it manually during POC, week-2 deliverable = loop with agent-assist on real events + read-only JSON endpoint | Quim direction 10-04 + investor (agent-callable must be literally true) |

## Roles (independent tracks)

- **Cofounder (SF) — full loop:** Track A + B + C. 40 venues, 60 organisers, run events, collect fees. Target neighborhoods: **Mission (Valencia/16th–24th) + Hayes Valley–Divisadero corridor** (Marina/Cow Hollow alternate). Priority organiser formats: **founder/business networking (most fee-tolerant), language exchanges, games/trivia, book clubs/writing socials, food socials** — venue-compatible social formats ≈44% of SF Meetup listings.
- **Quim (Malaga, until ~Oct 25) — supply smoke test:** 40 venue walk-ins in **Centro Histórico (primary, ~55–65% of sampled recurring-event venues) + Huelin (secondary, ~25% — beats the Soho hypothesis)**; capture real slots + terms into the schema; hand-test min-spend appetite ("¿te viene bien consumición mínima de X€?"). One ~90-min Centro walk covers Tier-1 warm leads (Bakkano 2.0, Sala Premier, Garrison's, El Colmao, O'Hara, Bartola, Museum Pub) + Tier-2 candidates (Recyclo — advertises event hosting, Kima, La Madriguera, Camden Lock, specialty-coffee row). Demand side: verified-channel organisers async + attend 1–2 events in person (Tándem Thu @ Sala Premier, Mundo Lingo Tue @ Bakkano).
- **Post-Oct 25:** Malaga continues only via already-made contacts (async); both founders in SF for the events push + application.

## Behavioral kill criteria (the real gates)

Green by ~Oct 24:
- ≥5 completed events across ≥4 venues (SF weighted)
- ≥2 organiser rebookings **through the platform** (the leakage test — booking #2 is what proves the model)
- ≥3 fees or min-spend contracts actually collected
- ≥1 venue requests another event unprodded; ≥30% of yes-venues re-offer slots within 30 days
- ≥1 measured till lift quoted by the owner ("you made my Tuesday worth €X")
- **≥2 venues commit to paying for visibility** (pilot or paid, €/$79–199/mo) — co-primary gate, because the venue subscription is the P&L

Red: events run but zero rebookings (leakage confirmed → the business is pure venue SaaS; pitch adjusts), no organiser pays anything (demand falsified → pivot C decision), or venues take events but nobody will pay for visibility even after a lift (B2B frame falsified → the whole model is pivot-A fee-led or pivot C).

## Agent-led event management (the ops core, retained on every pivot)

The concierge loop — match organiser↔venue/slot → negotiate terms → confirm → remind → run → settle (deposit/min-spend) → collect till outcome — is designed as an **agent loop**, not founder chores. POC implementation: founders run it manually with the ops-kit scripts (which double as the agent's future prompts), everything logged against the schema; by week 2 the matching + comms run with agent-assist on real bookings and the read-only endpoint (`GET /venues?day=tue&capacity=30`) is live so "agent-callable" is literally true. Same loop in pivots A, B, and C — in B it IS the product.

## Money mechanics (decided before first fee — investor requirement)

1. **Every booking:** organiser pays a deposit to the platform via payment link (Stripe/Bizum), refunded-applied on event-ran. This is the recurring money flow and the flake insurance.
2. **Min-spend deal:** organiser precommits a tab (card-on-file or deposit = min-spend floor); venue settles on the night against actual till. Underspend → platform collects the difference from deposit, pays venue. THIS is why the organiser keeps booking through us — the deal exists only via us.
3. **Flat hire:** deposit + balance via platform.
4. Liability: all POC events run as private-party bookings inside the venue's normal operations — no public door tickets, no advertised "ticketed event" framing, no live entertainment formats. One paid hour with a local lawyer per country before first booking (not a workstream — a sanity check).
5. Supper clubs = private reservations only (no public ticketed food events — health-permit territory).

## Week-by-week

| Week | SF (cofounder) | Malaga (Quim) |
|---|---|---|
| **W0 Oct 4–5** | Data pack lands → finalize 2 neighborhoods + formats + hit lists; Airtable up (schema + `last_confirmed_at`); localized scripts | same |
| **W1 Oct 6–12** | 20 venue walk-ins (Mission 14 + Hayes 8 corridor list) + 30 organiser contacts; daily funnel counts; first slot offers. ⚠️ SF Tech Week Oct 5–12 inflates tech/founder counts — don't extrapolate that week | 20 venue walk-ins (Centro loop + Huelin); async organiser outreach via verified channels only; attend Tándem Thu @ Sala Premier or Mundo Lingo Tue @ Bakkano to recruit |
| **W2 Oct 13–19** | Remaining contacts; first 2–3 events booked + run; first deposits collected; WTP one-pager shown to interested venues; JSON endpoint built | Remaining 20 walk-ins; demand contacts async; bank supply map |
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
