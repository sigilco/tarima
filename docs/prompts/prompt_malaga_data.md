You are a market-data analyst building a pitch-ready data pack on the MÁLAGA, SPAIN public events market, for a startup that books recurring community events into independent venues' off-peak hours.

Read the scope doc attached — the product is: recurring event organisers (language exchanges, expat/nomad meetups, book clubs, supper clubs, tech meetups, workshops) book independent restaurants/cafés/bars' dead Mon–Thu evening hours; organiser pays a booking fee; venue keeps 100% of F&B.

CONTEXT: Málaga (~590k city pop.) has a large expat/digital-nomad community (one of Europe's top nomad destinations), big tourism sector, universities (~35k students), a growing tech scene (Málaga TechPark/PTA, Google cybersecurity center). The market is thin compared to SF — part of your job is measuring HOW thin, honestly.

YOUR TASK — produce a data pack answering:

1. **Neighborhood distribution**: where do public/community events cluster (Centro Histórico, Soho, La Merced, Teatinos, Huelin, El Palo, Pedregalejo, plus Torremolinos/Benalmádena/Marbella noted separately if meaningful).
2. **Event-type mix**: language exchanges, expat/nomad social, tech/business meetups, book clubs, food/supper events, games, wellness, workshops, arts/culture, music/nightlife.
3. **Temporal distribution**: day-of-week + start-hour — where organiser demand meets venue dead hours (Spanish evenings run later; check 19–22h patterns).
4. **Venue types used**: cafés/bars/restaurants vs coworking vs cultural centers vs public space.
5. **Group-size distribution**.
6. **Recurring-organiser prospect list**: 20–30 NAMED organisers/groups (e.g., Málaga language exchanges, nomad/expat groups, Meetup groups, tech meetups like Málaga tech/dev communities, Internations) — name, format, cadence, est. size, platform, contact URL/handle.
7. **Venue hit-list input**: top 2 recommended neighborhoods + 15–25 named independent café/bar/restaurant candidates likely to host events (prioritize owner-run independents with visible dead weeknight hours).

METHOD: Meetup.com Málaga, Eventbrite Málaga, Facebook groups (expat/nomad/eventos Málaga), Internations, lu.ma (has some EU presence — check), local agenda sites (malagahoy.es, laopiniondemalaga.es agendas, malagaturismo), Eventbrite alternative platforms used in Spain (e.g., Shotgun, Xceed for nightlife), coworking community boards. Count via filters/sampling; every table needs method, basis, confidence (counted / sampled estimate / informed estimate), and source URLs. NEVER present an estimate as a count. If the data is genuinely thin, say so — a measured "thin" is a valid finding.

DELIVERABLES — create files and attach them all via message_user(attachments=[...]):
- `data_pack_malaga.md` — full pack, tables per axis, method+confidence, sources, "so what" per section (in EN; venue names/terms in ES as needed).
- `prospects_malaga.csv` — organiser prospect list (name, format, cadence, est_size, platform, contact_url, notes).
- `venue_candidates_malaga.md` — neighborhood shortlist + named venue candidates with rationale.
End with a message summarizing the 10 most load-bearing numbers.


ATTACHMENT:"https://app.devin.ai/attachments/2bcf5614-248c-4dbe-958e-3158668d219b/01_scope.md"
ATTACHMENT:"https://app.devin.ai/attachments/1c2757bf-b508-4f5a-a980-ee68cdcb2062/02_poc_draft.md"
