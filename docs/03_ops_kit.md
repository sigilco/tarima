# POC Ops Kit — schema, scripts, metrics

The venue record below IS the pivot-B seed: structured, machine-readable availability from the first walk-in. Run it in Airtable now; the same fields become the booking API's resource model later.

## 1. `venues` table schema (Airtable)

| Field | Type | Notes |
|---|---|---|
| venue_id | autonumber | canonical key |
| name | text | |
| city | single select: SF / Malaga | |
| neighborhood | single select | from data-pack list |
| venue_type | select: cafe / bar / restaurant / coworking / other | |
| capacity_seated | number | |
| capacity_standing | number | |
| slot_windows | linked `slots` records | see below |
| house_rules | multiselect: no_music / no_liquor_change / laptop_ok / buyout_ok / accessible / has_av | |
| price_model | select: free_minspend / flat_hire / free | |
| min_spend_amount | number | in city currency |
| flat_hire_amount | number | |
| owner_name / contact | text / phone | |
| contact_pref | select: whatsapp / email / in_person | |
| status | select: contacted / interested / slots_confirmed / hosted_1+ / priority_sub | |
| notes | text | |

`slots` table: `venue_id`, `weekday` (Mon–Sun), `start_hour`, `end_hour`, `min_group`, `max_group`, `price_override`. One row per bookable window. This is the artifact an agent (or a Nowadays-style planner) queries.

## 2. `organisers` table

`organiser_id`, name, format (meetup/bookclub/language/supper/runclub/workshop/games/arts/other), recurrence (weekly/monthly/adhoc), est_size, platform_found (luma/meetup/eventbrite/fb/ig/other), city, target_neighborhoods[], needs (multiselect: quiet/av/seating/free/price_cap), fee_reaction (select: no_ask / ok / rejected_at_X), status (contacted/replied/slot_offered/booked/ran/paid), notes.

## 3. Metrics sheet — one row per event, plus funnel counters

Funnel (per city, updated daily): `contacted → replied → soft_yes → slots_offered → booked → ran → paid`
Per event: `date, city, venue_id, organiser_id, format, group_size, duration_h, venue_fnb_take, our_fee, fee_type, would_repeat (Y/N ask both sides)`

Kill-criteria counters are computed from the funnel. No prose.

## 4. Outreach scripts

### Venue walk-in (EN — SF)
> "Hey — I run a small service that fills venues' dead nights with prepaid community events. We bring you a booked group on a night you're empty — meetups, book clubs, supper clubs. You keep 100% of the food and drink sales; the organiser pays us, not you. Do you have 15 minutes this week, or is there a better person to talk to?"
If yes-interest: capture slot windows + price terms INTO the schema on the spot.

### Venue walk-in (ES — Málaga)
> "Hola — tengo un servicio que llena los días flojos de los locales con eventos de comunidades ya organizados: clubs de lectura, intercambios de idiomas, quedadas. Te traemos un grupo con reserva confirmada en un día que está vacío; os quedáis el 100% de lo que consuman y quien organiza nos paga a nosotros, no a ti. ¿Tienes 10 minutos esta semana o con quién hablo?"

### Organiser DM (EN — Luma/Meetup/IG)
> "Saw your [event/group] — we place recurring events into cafés/bars on their empty nights. Have [Tue/Wed] slots in [neighborhood], some free-to-you on min-spend. Want a slot for your next one? Happy to send 3 options."
Fee probe after interest: "Booking fee is $25–50 flat once confirmed — or free if the room's on a min-spend and you hit it. Works?"

### Organiser DM (ES)
> "Vi vuestro evento de [tipo] — colocamos eventos recurrentes en bares/cafés en sus noches flojas. Tengo huecos [mar/mié] en [barrio]; algunos gratis con consumición mínima. ¿Te encajo el próximo? Te mando 3 opciones."

## 5. Event-day checklist (manual, concierge-style)

Confirm slot + terms in writing → organiser confirms group size → share one-pager to venue (who's coming, est. spend) → day-of check-in by message → collect fee before or day-of → post-event: ask venue till number + "want the next one?", ask organiser "would you book again and pay?" → log everything in metrics sheet.

## 6. The min-spend mechanic (the hard part — decide per venue)

Three workable models, cheapest first:
1. **Soft agreement** (default): organiser commits to a spend estimate; venue tracks till. Enforce socially, log actuals. Use for first events.
2. **Prepaid deposit**: organiser prepays $/€X toward the min-spend via payment link; venue refunds/voids if hit. Real commitment signal, zero POS integration.
3. **Tab contract**: only for venues that want repeat business — first X€ of the group's till is guaranteed. Needs venue buy-in; test in week 3.

Do NOT build payment infrastructure in the POC — a Stripe Payment Link or Bizum suffices.
