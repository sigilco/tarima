# Adversarial review — Market structure & competition (in-session pass)

## 1. SF reality: the wedge is not empty — it's priced differently

**Measured facts (Oct 2026):**
- Peerspace SF lists **280+ venues in the "meetup" category alone**, 21,052 people hosted in meetup venues, 4.91★, ~98% rebook intent. Hundreds more in "creative meeting" and café categories. The supply-side behavior we want to create *already exists* in SF — but at **$50–200+/hr rental pricing**, which is exactly what free/low-ticket community organisers cannot pay.
- Luma (SF's densest event layer) has **no venue-finding feature**: their docs tell hosts to set the venue themselves. The venue problem is visibly unserved *inside* the biggest organiser graph.
- **Net:** SF competition for our wedge isn't Peerspace-the-product, it's the informal channel (organiser DMs cafés, café says yes/no for free). We don't beat Peerspace on venue supply; we beat the DM on reliability and we price below Peerspace hourly by monetizing the organiser-side fee + min-spend instead of rent.

**Attack that survives:** Peerspace could add a "min-spend / community event" category tomorrow — they have the supply. Our defense is not supply exclusivity; it's (a) venues not on Peerspace (the walk-in-only independents, most of Malaga and much of SF's café layer), and (b) the organiser-graph + structured-availability API. Both are weak moats at v1 — admit it and plan for "community-priced tier" as the replicable playbook, not the moat.

## 2. Platform dependency risk — quantified

- Luma could add venue matching (they have the organiser graph). **Current evidence says they haven't and explicitly push venue-setting to hosts.** Time horizon of safety: unknown, probably 12–24 mo. The B-layer (agent-callable availability API) is the hedge — if Luma builds venue matching, venues listing *through our API* become the supply they need.
- Meetup charges organisers $29.99–55/mo already — our per-event fee *stacks* on top, which is the objection to beat (see customer grill).
- Scraping/DM-outreach ToS risk on Luma/Meetup is real but bounded: worst case is account restriction on the outreach channel, not the business.

## 3. Malaga reality check — demand is real but thin and weirdly shaped

- Proof of the exact behavior: **Málaga Tándem Club runs weekly language exchanges already placed in bars** (Sala Premier, The Garrison's Tavern) with €3 registration + welcome shot — organisers already monetize attendees and already consume venue rooms. The product exists informally; we'd formalize it.
- But: Malaga's event volume is probably 5–15% of SF's. The expat/nomad scene is real but seasonal (Aug collapse) and concentrated in Centro/Soho. Risk: **false negative** — the model fails in Malaga not because it's wrong but because there aren't 60 serious organisers to contact. The 60-organiser target may need stretching to Torremolinos/Benalmádena/Marbella or lowering the green bar to a hit-rate basis (e.g., ≥20% of contacted commit rather than ≥12 absolute).
- Malaga's hidden advantage: **venue-side competition ≈ zero** (no Peerspace density, no venue-booking category leaders) and owner-present venues say yes/no fast. It tests supply-side willingness cheaply, even if demand is thin.

## 4. Regulatory — bounded but real

- **SF:** Entertainment Commission permit required for *live entertainment* (band/DJ/comedy/dance) — $403 amendment fee, ≤12 days/yr per premises, Fire Dept Place-of-Assembly permit if occupancy ≥50. **Explicitly NOT needed: amplified sound only (iPod music, speeches, film) entirely indoors.** → POC constraint: social formats only (meetups, book clubs, talks, games), no live-music/comedy bookings, groups <50. Supper clubs are a grey zone (ticketed food service in a licensed restaurant = likely fine; "pop-up restaurant" framing = health-permit territory — keep supper clubs as private reservations, not ticketed public events).
- **Malaga/ES:** bar-hosted group events are routine (the tandem club proves it); watch terraza (outdoor seating) rules and actividad licensing — use interior space, normal bar operations, no door-ticket sales.

## 5. The B-layer verdict

"Machine-readable venue availability" is a real differentiator vs all venue marketplaces (which store listings, not bookable state) — but as a *business* it's post-PMF. The right framing for the application: "we're the only venue bookability layer designed for agent consumption" is a roadmap slide backed by the Airtable schema; the pitch remains the transaction volume. Nobody funds the API at idea stage; they fund the wedge that generates the data.

## Verdict: ENTER SF+MÁLAGA — with two changes

1. **Reframe SF's enemy**: not "Peerspace competition" (different price tier) but "the informal DM channel" — and pre-empt the Peerspace-moves-here attack in the plan's risk section.
2. **Malaga kill criteria → rate-based, not absolute** (commit-rate ≥20% of contacted, not ≥12 absolute) and expand organiser sourcing to the Costa del Sol corridor if centro runs dry.
3. **Hard format filter**: no live-entertainment formats in either city during POC (permit-free zone); groups <50 in SF.
