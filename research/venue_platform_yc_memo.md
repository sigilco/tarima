# Venue-Optimization Platform — Roast, Go/No-Go, Pricing, Pivot, Schedule

Date: 2026-09-25. Supporting research with sources: `yc_research.md`, `programs_research.md` (attached).

---

## 0. One correction before anything else

You said "~16 days remaining". YC W27's on-time deadline is **Nov 2, 2026 8pm PT** (decisions by Dec 11, batch Jan–Mar in SF). That is **38 days**, not 16. Deadlines that *are* ~16 days out: **PearX W27 (Oct 4)**, **500 Global B36 (~Oct 11)**. If 16 days came from a stale YC page, you have more room than you think; if you meant a self-imposed date, keep it — it's a good forcing function — but don't shortchange the traction window.

YC-relevant facts that matter for the decision:
- Deal: $500k ($125k for 7% + $375k uncapped MFN SAFE). Acceptance <1% (W24: 260/27k).
- ~40% of each batch is "just an idea" — idea stage is not a disqualifier. But among idea-stage admits, the pattern is *founder-market fit + evidence of speed*, not a deck.
- No RFS covers venues/SMB marketplaces (F26 RFS: AI-in-physical-world, defense, cloud for small software). Not fatal — RFS is a minority of what gets funded — but you get no thematic tailwind.
- Application is scored heavily on: what have you built, users, growth, why you, why now. Every day of the 38 should convert into a number you can put in the "progress" box.

---

## 1. The roast

### 1.1 "Venue optimization for any business" is not a startup, it's a category name
Restaurants, bookshops and offices have different buyers, different P&Ls, different idle-time patterns and different definitions of "value". A restaurant's idle asset is Monday–Wednesday off-peak seats; a bookshop's is floor space after 8pm; an office's is a meeting room and a legal/insurance problem. "Regardless of their business" reads to a YC partner as "we haven't picked a customer yet". The YC application will ask *who is your user, exactly* and the honest answer today is "we don't know".

### 1.2 The recommender is the pitch, but the recommender has nothing to learn from
"Gathers business intent and venue data and suggests next actions" presumes (a) data you don't have and (b) a feedback loop that only exists once actions were taken and outcomes measured. Day 1 you have zero venues, zero outcomes, and your "AI suggestions" will be a rules table any owner could write on a napkin ("host a book club on Tuesday"). The insights-for-later-joiners flywheel is real but is a *year-3* moat; it is not a reason to join today. Pitch it as such or don't pitch it.

### 1.3 Your "no hard third-party dependencies" condition is already violated
The three levers you list — Luma/Meetup organizers, art brokers, event promoters — are all third parties, and two of them (Luma, Meetup) are platforms you'd be funneling demand to without an API deal or economics. You'd be a middleman between a venue and someone else's marketplace with no control over supply, price or the transaction. If Luma adds a "find a venue" button (they have the organizer graph to do it), your lending lever is gone overnight. Either own the transaction or drop the condition.

### 1.4 Marketplace graveyard, and you're not aware of it
"Competition: not aware" is the weakest line in the brief. Venue supply-side marketplaces have been tried repeatedly:
- **Dead/pivoted:** Splacer (~$8.7M raised, dormant), Eventup ($8.5M, shut 2023), VenueBook (sold to Seated), Spacebase (pivoted).
- **Alive, commoditised:** Peerspace (20% take), Tagvenue (10–15%), Giggster (19%), Eventective ($57/mo listing), HeadBox (UK, ~£16M), Appear Here (pop-up retail, 10–30%).
- **Restaurant side, well-funded incumbents already selling "events" and "marketing":** SevenRooms, Tripleseat (19k venues), Perfect Venue, OpenTable Experiences, Toast IQ Grow ($499/mo AI marketing, launched May 2026), Yelp.
- **Art in venues:** Art44 ($299–499/mo), Artiq, Love & Paper (Spain).
- **YC already funded:** Venuetastic (W11, venue marketplace), TeamOut, Nowadays (S23, AI event planning), Boostly and Per Diem (restaurant growth), TryNearby (local creators for local businesses).
The pattern: venue-lending marketplaces struggle because SMB venue supply is low-intent and low-frequency (an owner lends the room 2–6×/year), so CAC never pays back at 10–20% of a €300 booking. Nobody has died doing "action recommender across levers" — which is either a gap or a sign it isn't a product.

### 1.5 "Instant value" is asserted, not shown
What does a bookshop owner get in minute 5 after signing up? A list of book clubs in their neighbourhood that need a room? You don't have that list. A Luma event they could host? You don't have Luma's data. Until you can name the artefact they receive on day 1 without any human in your loop, "instant value" is a promise, not a feature.

### 1.6 The B2C "undisclosed later" is a distraction
YC will ask about it, you'll say "later", and it costs you credibility with no upside. Cut it from the application; keep it as a footnote in your own roadmap.

### 1.7 The "humans and agents" sustainability angle is undefined
If you mean the platform is agent-operable (venue's AI agent negotiates with organiser's AI agent), that's a *genuinely interesting* 2026 angle (YC's current theme is "AI moving into the physical world") — but the brief doesn't say it. Right now it's a buzzword; either make it the core (see pivot B) or drop it.

### 1.8 What survives the roast (the real strengths)
- **The economic wedge is real and quantified:** private/hosted events are ~15% of restaurant revenue and ~20% of profits (Seated/VenueBook), event margins 20–60% vs 3–6% normal, OpenTable reports experiential bookings +46% YoY, 48% of diners prefer venues hosting pop-ups. Off-peak venue hours are a huge, unmonetised inventory.
- **SMBs pay for this category:** median SMB software spend ~$287/mo, marketing/CRM the largest slice. Restaurants already pay $149–499/mo for reservation SaaS and $499/mo for Toast's AI marketing.
- **The multi-lever framing is differentiated** — no incumbent sells "here are the 3 highest-EV things to do with your empty Tuesday", they each sell one lever.
- **You can start in Barcelona with zero platform dependency** if the first lever is *supply-you-control* (see 3.1).

Against your four conditions:

| Your condition | Verdict as briefed | What makes it true |
|---|---|---|
| Scalable | Partially. Software yes; supply acquisition is local and manual | Vertical + city wedge, then replicate the playbook; recommender data compounds |
| Value from day 1 | No (needs data you don't have) | Ship one concrete lever with real demand on day 1 (e.g. curated organiser pipeline) |
| No hard third-party deps | Fails as briefed (Luma/Meetup/brokers) | Own the booking + payment, treat Luma/Meetup as *distribution*, not infrastructure |
| Sustainable for humans & agents | Undefined | Make the venue's "availability + rules" machine-readable; publish an agent-callable API |

---

## 2. Go / No-Go recommendation

**Apply to YC W27 — but not with this brief.** Apply with a narrowed version, and only if the 10-day stress test below returns green. The narrowed thesis:

> "**Off-peak revenue OS for independent restaurants & cafés.** We fill the venue's dead hours with hosted events — supper clubs, book clubs, meetups, art openings — and handle discovery, booking and payment. Start: Barcelona. Later: any venue with idle hours; the actions engine learns which formats work for which venue."

Why this and not the original: one buyer (the owner/GM of an independent F&B venue), one KPI (incremental € per dead hour), one transaction you own (the booking), one city where you can hand-build supply and demand, and a credible expansion story (bookshops, galleries, coworkings are the *same product* with a different default template).

Apply in parallel to: **Techstars Spring 2027 (Nov 18)**, **Antler Continental Europe (rolling, Berlin)**, **Seedcamp/Kima (rolling)**. Skip for now: PearX (Oct 4 — too soon to have anything), 500 Global (Oct 11, same), a16z speedrun (consumer/AI-tilted, <0.4% acceptance, SF in-person; SR008 priority window Oct 12–Nov 1 — only if the stress test shows a consumer-demand spike), Neo (North America only), HF0/SPC (repeat-founder / deep tech). Full table in `programs_research.md`.

---

## 3. Stress test (days 1–10) — kill criteria, decided *before* you start

Run all three tracks concurrently. Cheap, manual, no code beyond a landing page and a Notion/Airtable back office.

### 3.1 Supply: will venues say yes?
- Walk into 40 independent restaurants/cafés/bars in 2 Barcelona neighbourhoods (Gràcia, Poblenou or Sant Antoni). Script: "We bring you a paid, pre-booked group on a night you're empty. You keep 100% of F&B, we take a fee from the organiser. Yes/no?"
- **Green:** ≥15 verbal yeses with a named contact and available slots. **Red:** <8.
- Bonus signal: ≥5 who'd pay €49–99/mo to be *prioritised* (sets up the SaaS layer).

### 3.2 Demand: do organisers want rooms badly enough to pay?
- Scrape/browse Luma + Meetup + Eventbrite for Barcelona events in the last 90 days (there are hundreds). DM 60 organisers of recurring events (book clubs, language exchanges, dev meetups, supper clubs, life-drawing). Offer: "We have 15 venues with free Tuesday/Wednesday slots, some with a min-spend deal, booked in one message."
- **Green:** ≥12 organisers book or commit to a date; ≥5 of them accept a €20–50 booking fee or a min-spend contract. **Red:** they'll take it for free but nobody pays.

### 3.3 Willingness to pay for the "actions" layer
- Build a one-page mock: "Your Tuesday 19–22h is worth €X. Top actions: (1) host Barcelona Python meetup — 40 people, est. €600 bar spend; (2) ..." Show it to the 15 yes-venues.
- **Green:** ≥5 say "I'd pay for this monthly" and give a number. **Red:** "nice, send me the event when you have one".

### 3.4 Decision rule (day 10)
- 3.1 green + 3.2 green → **go**; you have a two-sided pipeline and can run 3–6 real events before Nov 2.
- 3.1 green, 3.2 red → venues want it, organisers won't pay → **pivot A**.
- 3.1 red → owners don't care about dead hours enough → **pivot B or C**.
- 3.3 red alone is fine (SaaS layer is later); log it.

---

## 4. Pricing — adversarial review of your flat-plan instinct

Market patterns (numbers in `yc_research.md`):
- **Venue marketplaces:** free listing + 10–20% commission (Peerspace 20%, Giggster 19%, Tagvenue 10–15%).
- **Restaurant SaaS:** $119–499/mo per location (Perfect Venue $119–339, Resy/Tock $249–399, OpenTable $149–499 + $1–1.50/cover, Toast IQ Grow $499). Tripleseat/SevenRooms quote-only, ~$350–650/venue/mo.
- **Organiser tools:** freemium → $29–59/mo (Luma Plus $59, Meetup $29.99–55, Bookwhen $16–59).

Adversarial verdicts on your flat plan:

1. **Flat monthly plan on day 1 fails.** You have no data, no track record, and the venue's alternative is "do nothing, pay nothing". A flat fee before the first event happens is a conversion killer for SMBs and Toast/Yelp/OpenTable already own that budget line. Reserve flat plans for after venues have seen money land.
2. **Pure commission on a €300 booking fails too** (this is why Splacer/Eventup died): 15% × €300 × 4 events/yr = €180/yr/venue. Doesn't cover a single sales visit.
3. **What the numbers support: charge the side with money at the moment money moves, then upsell recurrence.**
   - **Phase 1 (0–6 months): organiser-pays booking fee + optional venue min-spend deal.** Organiser pays €20–50 flat or 10% of ticket revenue for a confirmed room; venue pays 0. Venue gets the F&B upside. Comparable: Luma 5% / Eventbrite 3.7%+$1.79 — organisers are already trained to pay per-event fees.
   - **Phase 2: "Priority" venue subscription, €79–149/mo/location,** priced just below Perfect Venue's $119–339 and well below Toast IQ Grow $499: guaranteed slots in the recommendations feed, calendar sync, post-event revenue attribution, the "actions" dashboard. Teams/chains: per-location with volume steps (the norm across Perfect Venue, Tripleseat, Meetup Pro) plus a HQ analytics seat — do *not* do a flat "team" price; multi-venue owners have very uneven venue values.
   - **Phase 3: performance pricing on measured lift** (EagleEye's pay-when-you-earn is the reference) — only viable once you attribute revenue (POS integration or min-spend contracts). Highest willingness-to-pay, hardest to prove; keep as a roadmap slide, not a launch price.
4. **Art lever:** rotating-art subscriptions already exist at $299–499/mo (Art44); don't build it, partner and take a referral fee. Same for Luma/Meetup: distribution partners, not dependencies.

Put in the application: Phase 1 as live pricing (with the first real € collected), Phase 2 as the model.

---

## 5. Pivot fallbacks (pre-scripted so a red result costs a day, not a week)

- **Pivot A — Organiser-first ("Airbnb for recurring community events").** If venues say yes but organisers won't pay: flip to a SaaS/marketplace for the *organiser* (the party with recurring need): a workspace that finds venue slots, negotiates min-spend, handles RSVP + payment, and pays the venue. Monetise via 5–8% on tickets + €29–59/mo for recurring organisers (Luma/Meetup pricing band), and you *become* the calendar layer venues plug into. Same supply, different buyer.
- **Pivot B — Agent-native venue availability layer ("Stripe/Calendly for physical space").** If owners don't care about dead hours but organisers desperately want rooms: build the machine-readable "this space is available under these rules at this price" standard + booking API, and sell to the fast-growing population of AI event planners (Nowadays YC S23 sources venues via AI; corporate planners, Luma-style tools). This is the "sustainable for agents" angle made literal and it sits squarely in YC's "AI meets the physical world" theme. Risk: standards businesses are slow; needs a design partner on day 1.
- **Pivot C — Private-dining / event pipeline for restaurants only.** The most boring, most proven wedge: private events = ~15% of revenue/20% of profit, incumbents (Tripleseat, Perfect Venue) are US-centric and expensive; Spain/EU is under-served. Sell a €99–199/mo per-location tool that generates and manages event inquiries. Less "venue-optimisation vision", but a YC-fundable SMB SaaS with a clear path to €1M ARR in a country you know.

Recommendation: A is the default fallback (keeps your supply work), B is the ambitious one if you want YC-theme fit, C is the safety net.

---

## 6. Schedule to Nov 2 (38 days) — and what the "16-day" version is

Principle: the application is written from the numbers, not the other way round. Target for Nov 2: **10+ venues live, 5+ events held, first € collected, one screenshot of the actions dashboard, 1-minute video.**

| Days | Dates | Track | Deliverable / gate |
|---|---|---|---|
| 1–2 | Sep 26–27 | Setup | One-page thesis (section 2), 40-venue hit list, 60-organiser list, landing page + Airtable/Notion CRM, 3.4 kill criteria written down and shared |
| 3–10 | Sep 28–Oct 5 | Stress test | Run 3.1/3.2/3.3 in parallel. Daily count. **Day 10 (Oct 5): go / pivot decision.** If pivot → re-run a 5-day mini stress test Oct 6–10 on the pivot; re-plan from day 15 |
| 11–17 | Oct 6–12 | First transactions | Book and run first 2–3 events manually (WhatsApp + a payment link). Collect the first fee. Record venue F&B lift (ask for the till number). Decide Phase-1 price from real objections |
| 18–24 | Oct 13–19 | Product v0 | Only what the events needed: venue profile + availability, organiser request → confirm flow, payment, post-event summary. Actions feed = ranked list of live organiser requests per venue (this is the "AI" v0; be honest about it) |
| 25–31 | Oct 20–26 | Scale the loop | 5+ events, 10+ venues, 20+ organisers. First "Priority" subscription attempt at €79–149/mo with the 3 happiest venues. Pull the numbers: GMV, take, repeat rate |
| 32–35 | Oct 27–30 | Application | Draft written from the numbers; 1-min founder video; 3 people who've read winning YC apps review it. Apply Techstars too (Nov 18 deadline, same material) |
| 36–38 | Oct 31–Nov 2 | Submit | Submit early Nov 1 (rolling review favours early). Nov 2 buffer |

**If you keep a hard 16-day clock (Oct 11):** it is exactly the go/pivot window plus the first 2–3 events. That's the right use of 16 days: don't spend any of them on the application text. The application itself takes 2 days when the numbers exist.

What YC will actually read from this: founders who found a real gap in a graveyard category, picked one buyer, ran real transactions in a month, and have a defensible expansion story. That's fundable at idea stage; the original brief is not.

---

## 7. Decisions I need from you

1. Accept the narrowed thesis (restaurants/cafés, Barcelona, off-peak events) as the version we build and apply with? Or do you want to keep bookshops/offices in scope for the test?
2. Confirm the deadline you're planning against: YC Nov 2 (38 days) vs a self-imposed Oct 11.
3. Which fallback do you want fully scripted (landing page copy + outreach script) before day 10: A (organiser-first), B (agent-native availability layer) or C (private-dining SaaS)?
4. Are you a solo founder? YC/Techstars/EF/Antler treat this very differently; it changes which programs to prioritise.
