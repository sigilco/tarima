# Payment-free POC — how to validate WTP without holding customer money

Constraint (Quim, 2026-10-04): no Spanish entity yet (an SL takes ~€3k + weeks to set up), and the US cofounder is on a student visa. Neither can safely hold customer funds, issue invoices, or be the merchant of record during the POC. The POC is validation, not a company — so **money must never flow through the founders or the platform**. Everything below is designed around that.

> Not legal advice — get one hour with an immigration attorney (US) and a gestor (ES) before running ops. But the design below keeps both founders out of the money flow entirely, which is the conservative posture for an F-1 holder and for operating in Spain without an entity.

## The two legal walls (why the design looks like this)

**US — F-1 visa:** no employment or self-employment in the US without OPT/CPT — and unpaid work *for* a venture still counts as work in DHS's reading. Passive ownership/founding is fine; day-operations for revenue isn't. Consequences for the POC: the SF track must be (a) unpaid research + product validation for a pre-incorporated venture, (b) zero revenue collection or invoicing by the cofounder personally, (c) no employment/contractor relationship formed with venues or organisers. Running a concierge *for free* to validate a thesis is the standard posture — the moment money is invoiced or held by him personally, it's a visa problem.

**Spain:** invoicing for services requires registering as autónomo (or an SL). Occasional informal brokering without invoicing sits in a gray zone nobody wants to test during a POC. Consequence: all Spanish deals settle **organiser→venue directly**; we introduce, write the terms, observe, and collect signatures — we never invoice, collect, or escrow.

## The payment-free rail (replaces "deposit escrow through us")

Instead of holding money, we hold **the slot and the terms**:

1. **We broker, they settle.** Slot terms (min-spend / deposit / flat hire) are written by us in a one-page slot agreement — but signed **venue↔organiser**, and settled venue↔organiser: deposit = organiser prepays the *venue* (Bizum/cash/card terminal), min-spend = bar tab at the venue, hire = venue's own invoice. We're named as the introducer in the doc, we're not a party to the money.
2. **Anti-leakage becomes slot-lock, not money-lock.** The recurring slot, the negotiated terms, and the rebooking window exist only in our registry. Booking #2 through us isn't enforced by escrow — it's how the organiser *keeps* the recurring slot (week-3 data: do they rebook through us anyway?). Honestly weaker than money-lock — flag it — but it's testable for free, and the money rail can be added post-incorporation without redesigning anything.
3. **Every booking carries a signed deferred-fee commitment.** The slot agreement includes a line: *"Service fee to [platform]: €X per booking — payable upon platform launch (deferred during pilot)."* The organiser signs. We measure **signed-acceptance rate of the fee amount** — the real WTP signal — and collect zero euros. Same one-pager tests fee *levels*: vary €10/€20/€30 across bookings and watch acceptance drop-off (Malaga €3/head anchor → test €15–25).
4. **Venue-side LOI for pivot B.** After any event with a visible lift, the venue signs a one-page letter: *"If a booking pipeline like this ran continuously, I'd subscribe at €X–Y/mo for placement + attribution."* Signed venue LOIs are the co-primary gate (≥2 by ~Oct 24) — they ARE the WTP evidence for the venue-pays model, and they cost nothing to produce.
5. **Fake-door readout (optional, keep honest).** In the booking flow, show the fee amount with "payable at launch" — acceptance/clicks measure intent without collection. Only use alongside the signed version; clicks alone are soft evidence.

## What still validates what

| Question the POC must answer | How it answers without touching money |
|---|---|
| Will organisers pay? | Signed deferred-fee commitment rate + the price they sign at (vary it) |
| Anti-leakage — do they come back? | Rebooking through the registry to keep their slot (behavioral, free) |
| Will venues pay for visibility (pivot B)? | Signed subscription LOIs after a measured lift — the pitch's money slide |
| Does the deal structure work? | Direct organiser→venue settlement observed (deposit/min-spend honored on the night) |
| Does it move revenue? | Owner-quoted till lift, same as before |

## Kill criteria — updated for the payment-free design

- ≥5 completed events across ≥4 venues (SF weighted) — *unchanged*
- ≥2 organiser rebookings through the registry (slot-lock retention) — *replaces "through the platform"*
- **≥3 signed deferred-fee commitments** — replaces "≥3 fees collected"
- **≥1 observed direct settlement** (deposit or min-spend honored on the night, organiser→venue)
- ≥1 unprodded venue request + ≥30% re-offer — *unchanged*
- ≥1 measured till lift — *unchanged*
- ≥2 signed venue visibility LOIs (pivot-B WTP gate) — *unchanged in spirit, now an LOI not a payment*

## What goes in the YC answer

"We ran the POC capital-free on purpose — pre-incorporation, we couldn't hold customer money, so we measured the hard thing instead: signed fee commitments and venue LOIs, plus real events that settled venue↔organiser directly. The money rail is written; it turns on with the entity." This is a stronger answer than "we took €300 through Stripe" — it shows the constraint was reasoned about, and LOIs are currency YC reads.

## Watch-outs

- **Don't fake it**: deferred-fee signatures mean nothing if the amounts are trivial. Test real prices (€20–25 / $40–75); a signed "€30 deferred" refusal is a data point, not a failure to hide.
- **Venue-side is the honest test**: a venue LOI signed *after* they saw till lift is worth more than ten organiser signatures — weight it accordingly.
- **F-1 posture**: SF cofounder = unpaid research/validation only. No personal invoicing, no money held, no employment relationships. Confirm with an immigration attorney before the SF trip.
- **Post-incorporation**: the deferred-fee commitments become real invoices at launch — that's a feature (a backlog of owed fees) if the commitments were signed honestly.
