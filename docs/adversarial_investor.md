# Adversarial Investor Review — "Off-peak booking layer for independent venues"

Reviewed: `venue_platform_yc_memo.md`, `01_scope.md`, `02_poc_draft.md`. Written as a partner who has seen this movie: Splacer, Eventup, VenueBook, Spacebase, and a dozen dead "empty space" marketplaces. Hostile but fair — every attack includes what would settle it.

---

## Top 10 attacks, ranked by severity

### 1. The recurring-customer model disintermediates you — recurrence kills the fee business — FATAL to the presented model

Your entire thesis is built on organisers with a *recurring* room need. But recurrence is exactly what makes you unnecessary. The platform's job is to make a match. Once a book club finds a café that works, they have the owner's WhatsApp and a standing Tuesday. Booking #2, #3, #40 through your platform costs them €25 each for zero marginal value — so they stop booking through you. You are selling the customer their own churn. This is worse than Splacer: Splacer died with low-frequency supply AND low-frequency demand; you have fixed demand frequency only to guarantee demand-side leakage.

There is no money flow to defend with, either. On a free room or a min-spend deal, no cash moves through you — the venue collects the bar tab, so there is nothing to escrow, nothing to hold hostage, no payment rail that keeps the organiser inside.

**Settles it:** any mechanism that makes money flow through you *recurringly* — deposits processed per event, min-spend settlement handled by the platform, or a rake on organiser→attendee ticketing. Also acceptable: concede the fee is a one-time matchmaking charge and price accordingly (subscription for the organiser workspace after N bookings).

**Fix:** the POC must explicitly test booking #2: does the organiser come back through the platform, and what did you give them that the venue's phone number doesn't? If the honest answer is "nothing," the business is the venue subscription (Phase 2) and the fees are bait — say that in the application instead of presenting Phase 1 as the business.

### 2. Phase 1 unit economics can't carry a company — and the honest TAM math is on nobody's slide — FATAL unless reframed

Bottom-up, being generous: ~30 dense metros × 300–800 recurring organisers who could pay = ~10–20k organisers per bloc, ~30k globally. At €30 average fee and 15 bookings/year each *with zero leakage* (impossible, see #1), that's a ~€13M/year gross-fee ceiling at 100% share — realistically €0.5–1.5M/year. And both sides are acquired by hand (walk-ins, cold DMs) at a €25–50 order value, so CAC never pays back at Phase-1 pricing. The memo's own autopsy of Splacer — "CAC never pays back at 10–20% of a €300 booking" — applies verbatim to you: you've moved the fee to the other side but kept the same order of magnitude.

The real company is Phase 2 (venue SaaS ~€6M ARR at plausible penetration, expandable) or the API bet — but Phase 2 is gated on "venues that have seen money land," i.e., months of manually subsidized events before the first real revenue line exists.

**Settles it:** the application shows the wedge→business→option structure explicitly: fees acquire supply, subscriptions monetize it, the API is the call option. Plus a Phase-2 conversion signal in the POC (the 3.3 WTP mock is the right instrument — but it's scheduled week 3 and optional-feeling).

**Fix:** stop calling Phase 1 a business model. Call it a supply-acquisition subsidy and show the venue subscription as the P&L. Move the WTP dashboard test earlier — it's the only artifact that tests the actual business.

### 3. Two cities is founder geography dressed as experimental design — the datapair proves less than claimed — SERIOUS

The draft says the pair is "designed falsification." It is not a controlled comparison. SF and Malaga differ on demand density, supply competition, price level, informality, language, founder tenure, and sales channel — six confounded variables. If SF greens and Malaga reds you cannot attribute it to "incumbent competition" vs "thin demand" vs "different founder effort." At n=40/60 per city you also lack the power to detect the differences you'd care about; a 12/40 vs 18/40 split is noise.

And the deeper problem: **Malaga is a market you are abandoning on ~Oct 25.** Even if Malaga greens, there is no operator there to keep it green — its only value is a "portability" bullet in the application. You are spending 50% of founder-hours for 3 weeks producing a footnote.

Would I rather see 40 venues in one city? **Yes — in SF.** One city lets you iterate the script neighborhood-by-neighborhood, lets organisers and venues reference the same real events, and produces the number the app actually needs (events run + € collected). What the datapair DOES prove if it works: the playbook isn't founder-specific and isn't SF-specific — a real result, but a paragraph, not a moat.

**Settles it:** a written playbook + a replication run by someone who is *not* a founder, or a staggered design: Malaga as a reduced-scope smoke test (2 weeks, Track A only) while SF runs the full loop, then Malaga continues async via the local contacts already made — the draft itself floats this; take it.

**Fix:** keep both cities but demote Malaga to "replication at half scope" and stop claiming the pair isolates a variable. Spend the saved founder-hours on running actual events in SF.

### 4. Charging organisers fixes revenue, not the graveyard's cause of death — SERIOUS

The memo's own diagnosis: venue marketplaces died on low-intent, low-frequency supply. The counter-thesis — "we charge the other side" — changes who pays, not whether supply stays warm. The venue still hosts 2–6 events/year, still doesn't open your app between events, still forgets its stated slot rules, still flakes the night you need them. Meanwhile the organiser side has the recurring need — but only until they settle into a room, at which point they leave (see #1). You have inverted the marketplace and kept both failure modes.

**Settles it:** venue reactivation metrics — % of yes-venues that host a second event without being re-sold; a venue calling *you* asking for the next group; slots still accurate 30 days after onboarding. If venues stay warm only when you call them, this is an agency with software.

**Fix:** add a supply-side retention falsifier to the kill criteria (e.g., ≥30% of yes-venues host or re-offer slots unprodded within 30 days). The Airtable schema needs a "last-confirmed-at" field or your slot data rots silently.

### 5. The machine-readable availability layer is a feature — the moat, if any, is the supply pipe nobody wants — SERIOUS

"Machine-readable availability" is a schema. Peerspace, Luma, or Calendly can ship a JSON schema over a weekend; what they can't ship is *live inventory in it*. The moat is the ugly, manual, door-knocked supply pipe — which simultaneously (a) is why Luma/Peerspace probably won't chase you into café-min-spend land (nobody wants this ops), and (b) is your scaling ceiling, because walk-in sales doesn't replicate without founder heroics per city. You currently claim the schema as the moat and get it backwards both ways: it's not defensible, AND the thing that is (exclusive live supply) is exactly what makes city #3 cost as much as city #1.

On "Luma adds find-a-venue": organiser graphs don't bootstrap café supply, agreed — but a funded copycat with $5M and gig workers does the same walk-ins you do, in months. Nothing here is exclusive.

**Settles it:** any exclusivity primitive — preferred-partner terms with venues, deposit/escrow lock-in, organiser workspace lock-in — or honest framing: "the moat is accumulated structured supply + the multi-city playbook," with the playbook's replication cost measured, not asserted.

**Fix:** in the application, claim the moat as "the only live, terms-level index of off-peak independent-venue inventory — built transaction by transaction," and show the per-city supply-acquisition cost so replicability is a number, not a hope.

### 6. The kill criteria measure politeness, not transactions — they can greenlight a false positive — SERIOUS

"Soft-yes with named contact" is free to give. "Commit to a date" is free to give. A venue saying "sure, send me groups" while never stating a usable slot, and an organiser saying "yes I'd pay €25" while never paying it — both score green on your current gates. The draft even notes "a venue that won't state terms isn't a yes" — good instinct — but then the headline criteria still count soft-yeses.

What's missing entirely: **completed events, repeat bookings, and money**. Those are the only falsifiers a partner believes.

**Settles it:** kill criteria rewritten behaviorally — e.g., green = ≥5 completed events across ≥4 venues, ≥2 organiser rebookings, ≥3 fees or min-spend contracts actually collected, ≥1 venue requesting another event, measured till lift ≥€200/event (or the organiser's alternative-cost beaten). Contacts and soft-yeses become leading indicators on the dashboard, not gates.

**Fix:** adopt the above; the current thresholds stay as pacing targets.

### 7. You're about to take real money with undefined money mechanics — SERIOUS

You "own the transaction" from week 2 — while the min-spend enforcement question is still an open bullet ("how does a café actually collect on €300 min spend?"). So: who holds the deposit? What happens on organiser no-show? On venue flake? On a 30-person event in a licensed café — whose insurance, what permits (CA ABC/liability vs ES)? Disputes and a single bad incident are where venue trust dies, and venue trust is the whole supply side.

**Settles it:** a one-page event contract: organiser pays a deposit to the platform (refunded on event-ran), min-spend is the venue's own bar commitment enforced as a house rule (organiser precommits to a tab, settled on the night via card-on-file), liability stays inside the venue's normal private-party operation (no special event status → no new permits for small groups). Get one local-lawyer sanity check per country — a paid hour, not a workstream.

**Fix:** write that contract before the first collected fee, not after the first dispute. In CA, keep POC events under private-party norms and say so.

### 8. The demand-sourcing channel may not mechanically exist — SERIOUS (potentially fatal to Track B in Malaga)

"DM 60 organisers on Luma/Meetup" assumes a channel. Luma has no real cold-DM surface; Meetup organiser contact is gated; scraping organiser identities for cold outreach puts you ToS-dependent on the same platforms the memo says must be "distribution, not dependencies." In Malaga — thin Luma/Meetup density by the doc's own admission — the 60-organiser list may simply not exist on those platforms at all; the real channels are Facebook groups, Internations, WhatsApp, university boards, each with different conversion.

The entire POC also hinges on the "data pack" landing Oct 4–5 producing 20–30 named organisers per city. If it slips 48 hours, everything compresses into the final week before the Oct 24 verdict.

**Settles it:** the Oct 5 gate includes a *verified contact channel* per organiser (a group you can post in, an email, a mutual intro — not "handle on platform X"). If the pack can't produce that for Malaga, that's an early red on demand before you've spent two weeks.

**Fix:** treat "channel exists" as a first-class gate in the data-pack deliverables; pre-plan the fallback (physically attend 2–3 meetups in week 1 and recruit organisers in person — slower but un-blockable).

### 9. Founder-market fit is absent from all three documents — SERIOUS at a <1% bar

Nowhere does any doc say why *these* founders. No venue ops background, no event-organising background, no "we built this because we ran meetups and hunted rooms" story is stated. At idea stage, YC admits on founder-market fit + evidence of speed — you have a plan for speed and nothing for fit. Compounding it: one cofounder is in transit during the decisive weeks, and the POC's last pre-deadline week ("joint SF: run 3+ events, write application, submit") is over-packed by anyone's estimate.

**Settles it:** if either founder has run events, managed a venue, built a community, or worked restaurant/hospitality — put it in the app's first paragraph and let the POC be "founders with a pain who moved fast." If neither has that history, the app must carry "we manufactured FMF in 4 weeks by running N real events" and the bar on numbers rises.

**Fix:** answer "why us" in one sentence now, or admit it's execution-speed-only and make the progress box do the work (which pushes even harder on #6 — real events, not soft-yeses).

### 10. The agent-callable narrative outruns the artifact — MINOR, cheap to fix

The application's boldest claim — "availability is agent-callable" — is currently an Airtable. A technical partner who asks "show me the endpoint" gets a Notion link. That's the correct amount of infrastructure for a 3-week POC, but the *narrative* should not be a day ahead of what you can demo.

**Settles it:** one day of work: a read-only JSON endpoint over the venues table (`GET /venues?city=sf&day=tue&capacity=30` returning slots + terms). Then "agent-callable" is literally true in the demo and you can say "an agent could book our entire inventory today" with a straight face.

**Fix:** build it in week 2, screenshot it, put the URL in the app.

---

## What would actually convince me this is a company

Not the current kill criteria. This: **10+ completed events in one city, ≥3 organiser rebookings without founder involvement, ≥3 fees collected through the same flow every time, ≥2 venues asking for more events, and one measured till lift a venue owner quotes back to you** ("you made my Tuesday worth €450"). Bonus: a venue paying the €79–149 Priority tier. That bundle is a company at seed stage; 15 soft-yeses and 12 commits is a serviceable concierge.

## Verdict

**CONDITIONAL** — fundable shape, but only if the POC measures transactions instead of politeness and the app admits the fee business is the wedge into venue SaaS + API, not the company; the docs as written could return green while proving nothing.

## Top 3 changes to the plan

1. **Rewrite the kill criteria as behavior, not sentiment:** gates = completed events, rebookings, collected fees, measured till lift, venue-initiated requests. Contacts/soft-yeses become pacing metrics only.
2. **Stagger the cities:** SF runs the full playbook as primary; Malaga runs a half-scope replication (supply-side smoke test, then async demand) — and drop the "controlled falsification pair" framing, because the comparison is confounded and Malaga is unmanned after Oct 25.
3. **Fix the leakage story before you pitch it:** make one recurring money flow run through the platform (deposit escrow or min-spend settlement or ticketing rake), or reframe honestly — fees acquire supply, the venue subscription is the business, the API is the option.
