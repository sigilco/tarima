You are a market-data analyst building a pitch-ready data pack on the SAN FRANCISCO BAY AREA public events market, for a startup that books recurring community events into independent venues' off-peak hours.

Read the scope doc attached — the product is: recurring event organisers (tech meetups, book clubs, language exchanges, supper clubs, run-club socials, board-game nights, workshops) book independent restaurants/cafés/bars' dead Mon–Thu evening hours; organiser pays a booking fee; venue keeps 100% of F&B.

YOUR TASK — produce a data pack answering these questions with REAL, CURRENT data (last ~90 days where possible):

1. **Neighborhood distribution**: which SF neighborhoods host the most public/community events (Mission, SoMa, Hayes Valley, FiDi/Union Square, Marina/Cow Hollow, Castro, North Beach, Richmond, Sunset, Haight, Potrero/Mission Bay, Downtown; note Oakland/Berkeley separately if data shows meaningful volume). Estimate share of events per neighborhood.
2. **Event-type mix**: share by format (tech/startup, founder/business networking, language exchange, book club, supper club/food, games/social, wellness/run-club social, workshop/class, arts/culture, music/nightlife, other).
3. **Temporal distribution**: day-of-week counts and start-hour distribution → map where organiser demand meets venue dead hours (Mon–Thu 17–22h is the hypothesis).
4. **Venue types used**: what fraction of these events happen in cafés/bars/restaurants vs coworking spaces vs dedicated event venues vs public space.
5. **Group-size distribution**: typical attendance bands for community-format events.
6. **Recurring-organiser prospect list**: 25–35 NAMED organisers/groups of recurring events suitable for a café/restaurant room (e.g., recurring meetups, book clubs, run clubs, supper clubs, founder meetups) — name, format, cadence, est. group size, platform, contact URL/handle.
7. **Venue hit-list input**: top 2 recommended neighborhoods for walk-in venue outreach + 15–25 named independent café/bar/restaurant candidates there that plausibly host events.

METHOD: use lu.ma (SF is Luma's densest market — browse lu.ma/discover and SF category/city pages), Meetup.com SF listings, Eventbrite SF, Funcheap, SF Station, Do415, local subreddits. Count via category/city filters and sampling where full enumeration isn't feasible. Every table must state: method, sample size or count basis, confidence (counted / sampled estimate / informed estimate), and source URLs. NEVER present an estimate as a count. If a source can't be measured, say so and bound it.

DELIVERABLES — create files and attach them all via message_user(attachments=[...]):
- `data_pack_sf.md` — the full pack: distribution tables per axis, method+confidence notes, sources, and a short "so what" per section (what it means for venue outreach and POC scoping).
- `prospects_sf.csv` — the organiser prospect list (columns: name, format, cadence, est_size, platform, contact_url, notes).
- `venue_candidates_sf.md` — neighborhood shortlist + named venue candidates with one-line rationale each.
End with a message summarizing the 10 most load-bearing numbers for pitches and POC scoping.


ATTACHMENT:"https://app.devin.ai/attachments/2bcf5614-248c-4dbe-958e-3158668d219b/01_scope.md"
ATTACHMENT:"https://app.devin.ai/attachments/1c2757bf-b508-4f5a-a980-ee68cdcb2062/02_poc_draft.md"
