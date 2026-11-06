# Tarima GTM assessment — source transcript vs today's codebase

Date: 2026-11-05 (all web checks run this date). Scope: READ-ONLY, branch `work/gtm-assess` @ `311be32` (= pushed `work/sp3d-mirror` chain tip).

Sources used: `/tmp/tarima-gtm-source.md` (transcript, treated as data), the repo at this worktree, `~/Documents/prjcts/_own/tarima/.agents/plans/2026-11-04-agent-platform.md`, `.agents/plans/2026-11-02-room-port-and-vc-demo.md`, `.agents/plans/2026-10-29-beta-workstreams.md`, `research/competitors.md` (main repo, untracked), and the in-flight plan `/tmp/tarima-plan.md` (not on this host; recovered from the VPS via ssh ovhcloud, W0–W5: dev/preview + turbo, tiered validation, Chat SDK WhatsApp, eve memory, bookkeeping).

Vendor claims re-verified today where cited; everything else is marked unverified.

---

## 1. Applicability matrix

Effort: S < 0.5d, M 0.5–2d, L > 2d. "Touch" = file:line on this branch.

### Product ideas

| # | Idea | Rating | Touch | Effort | Why |
|---|---|---|---|---|---|
| P1 | Quote engine (localized outreach, push for better rates, side-by-side offers) | later | new agent tools + dormant `deal_*` tables (apps/api/src/db/schema.ts:459-587) | L | The differentiator per competitors.md, but it needs the live outbound→inbound loop first; the demo can simulate terms in chat |
| P2 | Parallel negotiation (quote vs quote) | later | `entities` statuses (apps/api/src/db/schema.ts:99-111), `deal_comparison` (schema.ts:563) | L | Depends on P1 plus several entities in `chasing` at once; no room survives to drive it (SP7 removed it) |
| P3 | Parse replies incl. PDFs/photos | later (text part: apply-now) | webhooks exist but unmounted (apps/api/src/routes/webhooks.ts:121-195; NOT in apps/web/src/lib/api-handlers/index.ts:41-61); attachment store already in packages/channels/src/attachments.ts | M | Plain-text reply capture is cheap once webhooks mount; PDF/photo parsing is post-demo |
| P4 | Approval-ready messages (2-click approve) | apply-now (DONE) | apps/web/agent/approval.ts:26-33, tools/send_email.ts:34, apps/web/src/components/chat/ChatApproval.tsx:13-53 | S | SP8 shipped the gate; the panel renders eve interactions |
| P5 | Human/agent split as written positioning | apply-now | apps/web/agent/instructions.md:23-31 already encodes it; landing copy tweak | S | Matches Comtev/BoomPop's settled frame; zero build |
| P6 | Named approver sign-off | apply-now (single-owner version) | approvals.decidedBy (apps/api/src/db/schema.ts:631) already mirrored; multi-name approval is later | S→M | For pilots the owner's click IS the named approver; record it in the demo script |
| P7 | WhatsApp guest list / RSVP (Comtev Gather) | reject | none | — | Different product surface (guest mgmt, passes, check-in); nothing in the schema or plan serves it |
| P8 | AI venue finder, brief → booked in 4 steps | later | agent has list_venues (apps/web/agent/tools/list_venues.ts:8-36) but no booking model; payment-free posture | M+ | "Booked" is a post-incorporation rail; demo stops at shortlist + staged outreach |

### Pricing / positioning ideas

| # | Idea | Rating | Touch | Effort | Why |
|---|---|---|---|---|---|
| P9 | Flat per-event, no supplier commission (Comtev £79/mo, £250/event) | apply-now | docs only; informs Phase 1 organiser-fee design | S | Commission models are the documented graveyard; flat-fee fits the payment-free POC and the deferred-fee commitment design already in docs/08 |
| P10 | "Minutes not weeks" hero frame | apply-now | landing copy (apps/web/src/routes/index.tsx) | S | Incumbent-proven frame; Tarima's landing already sells speed + approval |
| P11 | Venue-side partner surface (pivot B evidence) | later | none now | — | Correct strategic reading (venue side is fundable) but not buildable in a 2-week GTM push |
| P12 | Buyer mismatch fork (corporate EA vs solo organiser) | apply-now | positioning docs | S | Keep targeting solo organisers (the current agent persona, instructions.md:3-4); corporate-enterprise is a different product per competitors.md:25 |

### GTM motions

| # | Idea | Rating | Touch | Effort | Why |
|---|---|---|---|---|---|
| G1 | Approach A: concierge pilots | apply-now | none (process) | — | Right call at 15–20 calls/week; founder hours are the constraint, as the source says |
| G2 | Discovery merged into sales (append-only) | apply-now | none | — | Costs nothing, keeps kill-criteria scoring |
| G3 | 2-day dogfooded demo | apply-now WITH GAPS | see deliverable 2 | M | The code does most of the scripted run; the send step and agent-staged rows are missing (see gaps) |
| G4 | Sell collab without building (observer links as the thin version) | later | observer-link contract survives (packages/contract/src/observer-link.ts:14-37) but the service/routes/UI were torn down in SP7 (plan line: "observer links … DEFERRED") | M | Pitch via screen share today; revival is a small ticket (schema + routes survive in schema.ts:431-457) |
| G5 | Dogfood the agent as your outbound | apply-now AFTER one gap | send_email stages but nothing sends (send_email.ts:16-19 explicitly defers the sender) | M | Feasible and compliant for WARM lists once an approve→send drain exists; see deliverable 2 for the compliance verdict |
| G6 | Cold email from personal Gmail at low volume | apply-now | none | — | Agreed with the source's boundary; for Spain see LSSI note in deliverable 2 |
| G7 | Never cold WhatsApp | apply-now | none | — | Meta policy requires opt-in; outside the 24h window needs an approved template (verified, see compliance) |
| G8 | Separate sending identity from transactional Brevo domain | apply-now | Brevo sub-account/domain config | S | Protects OTP deliverability; the transactional seam is apps/api/src/mail.ts:38-57 |
| G9 | Refine the demo = make one real run, not polish | apply-now | scripts/seed + instructions | S | Correct posture; seed script now EXISTS (stale-in-a-good-way, see below) |

### Tools

| # | Tool | Rating | Why |
|---|---|---|---|
| T1 | PostHog (cloud free) | apply-now | Verified today: 1M events/mo, 5K replays, no card (https://posthog.com/pricing, 2026-11-05). Covers funnel + replays + surveys + flags in one |
| T2 | Twenty (self-host) | apply-now (or defer if pipeline <10 deals) | Cloud has NO free tier (Pro $9/user/mo verified, https://twenty.com/pricing, 2026-11-05); self-host of the open core is free (same page). You already run a VPS; AGPL core keeps data local |
| T3 | Cal.com (cloud free) | apply-now | Verified: free forever for 1 user, unlimited links/calendars (https://cal.com/pricing, 2026-11-05). Don't self-host this one |
| T4 | Apollo.io free | later | Entry-level plans exist but the page did not expose free-tier specifics to my fetch (https://www.apollo.io/pricing, 2026-11-05); unverified. Only needed when the warm list exceeds ~50 names; the source's own rule says don't buy prospecting before 100+ contacts |
| T5 | Tally (cloud free) | apply-now | Verified: unlimited forms + submissions free (https://tally.so/pricing, 2026-11-05). Use for the pilot-brief intake |
| T6 | Documenso | later | Verified free tier is 5 docs/mo, 10 recipients (https://documenso.com/pricing, 2026-11-05); self-host exists. Defer until the first signed pilot commitment; email LOI suffices for POC |
| T7 | OBS / Loom / n8n | reject as picks | Use the OS screen recorder; Loom only when async follow-ups exist; n8n only past ~2 automations (source's own rule, agree) |
| T8 | Smartlead / Instantly / HubSpot free / Calendly / paid CRM | reject | Consistent with source; nothing at this volume justifies them |

### Stale or wrong claims in the source (checked against this branch)

1. "Run the chase engine against your own waitlist" — WRONG NOW. `packages/chase` was deleted in SP7 (commit c97e7a3). The successor is the eve agent + gated `send_email`, which does not send yet. The dogfood motion needs the drain-on-approve job first.
2. "Negotiation room counter-offer → observer link" as demo steps — STALE. The room, ShareRoomModal, NegotiationRoomView and `/app/p/*` routes were removed in SP7 (dc19eaf, c97e7a3; apps/web/agent/../ProjectView.tsx:74 still links the dead `/app/p/$projectId`). The scripted demo cannot include a room or observer link today.
3. "load venue_candidates into the staging venue_catalog, seed script is in the plan" — DONE ALREADY. apps/api/scripts/seed-venues.ts + seed-venues.data.ts exist (SF + Málaga), idempotent on (city, name), runnable via `pnpm -C apps/api seed-venues`. Most rows have no contacts (seed-venues.data.ts:14-18), which the agent honestly reports (list_venues.ts:9-10).
4. "Telegram via grammY long-poll" — SUPERSEDED. Telegram is now eve's built-in channel behind connect-code binding (apps/web/agent/channels/telegram.ts:48-53); packages/telegram is deleted. Note: Telegram inline approval buttons exist in the vendored eve (packages/eve/dist/src/public/channels/telegram/hitl.d.ts) but SP8 never wired a send_telegram tool, so remote approvals have nothing to approve yet.
5. "venue_catalog / old chase engine describe the pre-teardown beta" — CONFIRMED STALE. Board routes, drafts, stage, approve, curate endpoints are gone (apps/web/src/lib/api-handlers/ui.ts:1-10). What survived: projects/entities CRUD, outbox, venue_catalog, channel_bindings, connect_codes, agent_events, approvals, dormant deal/room tables.
6. "Comtev stopped working" — FALSE TODAY. comtev.com is live and marketing ("Great events. Less legwork…", free to start, plans from £79/mo) (https://comtev.com/, 2026-11-05). The £250/event enterprise line was not verifiable from the homepage.
7. "BoomPop acquired by Navan ~$95M Sept 2026" — UNVERIFIED. boompop.com still resolves as a standalone brand with its own careers page (https://boompop.com/, 2026-11-05). Acquisition may be real but needs a press check before it goes into any pitch.
8. "Nowadays" — DOMAIN HAZARD. nowadays in the transcript is the YC S23 AI planner (nowadays.ai); https://www.trynowadays.com/ is a THC-drink brand (checked, 2026-11-05). Don't cite the wrong domain in outreach.
9. PostHog "1.5K survey responses" + startup credits "<$50K" — NOT VERIFIED today (the pricing page confirms 1M events + 5K replays only). Check the surveys page + startup program before quoting.
10. Cal.com "self-host went private April 2026" — NOT VERIFIED today; the pricing page doesn't discuss it. The recommendation (don't self-host Cal.com at this stage) stands regardless.
11. Twenty "GraphQL API + MCP server" — NOT RE-VERIFIED; low stakes, check when wiring.
12. EagleEye 28% F&B claim, Naboo $70M, Always Friday €1.05M, TeamOut terms — NOT RE-VERIFIED; plausible, keep out of any external material until checked.
13. WhatsApp claims in the source (24h window, template pending, 5-recipient test number, 24h token rotation) — CORRECT and still current per .agents/docs/whatsapp-cloud-notes.md:102-127 and Meta/Vonage docs (see compliance section).

---

## 2. GTM readiness check against today's app

### What the 2-day dogfooded demo CAN use today

- Login: real OTP flow (Brevo seam + loopback inbox for `@tarima.test`, apps/api/src/mail.ts:26-40) plus instant dev-login (apps/web/src/lib/api-handlers/dev-login.ts) — a demo audience can be signed in in seconds.
- Project + rows: create/list projects and entities via `/api/ui/*` (apps/web/src/lib/api-handlers/index.ts:47-51), rendered read-only in the workspace (apps/web/src/components/workspace/ProjectView.tsx:87-119).
- Agent chat: streaming panel over the in-process eve runtime (apps/web/agent/runtime.ts:65-102), verified working end to end in the browser per the 2026-11-05 handoff.
- Curation-ish turn: `get_project_context` + `list_venues` + `list_sponsors` read the seeded catalog with honest no-contact reporting (apps/web/agent/tools/list_venues.ts:8-36); `update_task` moves row statuses (tools/update_task.ts:12-37).
- HITL proof: `send_email` stages to the outbox behind `approval: always()` (tools/send_email.ts:34, idempotent at :45-63); the panel renders the approval card; every fact mirrors into SQLite (apps/web/agent/hooks/mirror.ts:24-58 into `agent_events`, `approvals`). "Nothing is sent without a click, and it's all logged" is demoable NOW at the SQLite level.
- Channels: Telegram channel with connect-code binding (apps/web/agent/lib/telegram-bind.ts) — needs `TELEGRAM_BOT_TOKEN`; the live-phone gates were never run (.agents/docs/whatsapp-cloud-notes.md:129-135).
- Seed data: catalog seed script ready; a "Berkeley Demo Night" test project already exists in the local preview DB.

### Concrete gaps (what the demo needs that the code cannot do yet)

1. Approve doesn't send. `send_email` writes `outbox` rows with `status: 'staged'` and explicitly no SMTP (send_email.ts:16-19); no drain job exists anywhere on this branch. Until an approve-settle hook moves staged rows through the Brevo/file seam, the loop dead-ends after the click. Effort M (0.5–1d).
2. The agent cannot stage curated rows. There is no `create_entity` tool — `update_task` only moves an existing row's status, and rows come from the UI POST. The scripted "brief → 5 curated venues staged on the board" turn is impossible; the agent can only describe candidates in chat. Effort S (mirror update_task's ownership pattern).
3. No brief capture path. `projects.goal` is read by `get_project_context` but nothing writes it (no UI, no tool). The dogfooded demo can carry the brief in chat, but a `set_brief`-style tool (or instructions telling the agent to persist goal JSON) makes the artifact real. Effort S.
4. Inbound replies are unreachable. WhatsApp/email webhook routes exist in apps/api (webhooks.ts:121-195) but are not registered in the single-process dispatcher (api-handlers/index.ts:41-61 has no `/webhooks/*` row). The chase loop's reply half — the thing that makes "negotiation" credible — is dark. W3 (Chat SDK WhatsApp) covers the WhatsApp side; email inbound needs the same mounting. Effort M per channel.
5. WhatsApp is not on this branch at all. W3 is in flight on another worktree; today the demo channels are in-app + Telegram only. The `chatSdkChannel` seam it needs exists in vendored eve (packages/eve/dist/src/public/channels/chat-sdk/chatSdkChannel.js).
6. Observer/team story is absent. Single-owner projects; observer link service torn down; dormant `room_share_links` table survives (schema.ts:431-457). Demo must pitch collaboration by screen share; the "share a link" moment is not available. Effort M to revive in the new workspace.
7. Small dead link: ProjectView links `/app/p/$projectId` which 404s post-teardown (apps/web/src/components/workspace/ProjectView.tsx:74). Trivial fix, but it's exactly the kind of thing a prospect clicks.
8. Audit is CLI-only. The audit tab (plan P5) doesn't exist; during a demo the "approve log" is a sqlite3 query. Fine for dogfooding, weak for a VC/prospect room. Effort S for a read-only table view.
9. No product analytics. Nothing instruments the landing or the approve-click yet (PostHog not installed). Effort S.
10. The new stack has never deployed. SP10 (VPS cutover of the single-process eve app) is pending; the deploy kit (release dirs + symlink flip) is proven for the old layout. Demo runs locally today — acceptable; don't block on staging.

### Dogfooding the agent as outbound: feasibility and compliance

Feasible for WARM outreach once gap 1 closes. The pieces that matter are already in place: the HITL gate means the founder clicks every send (send_email.ts approval + approval.ts:28-33 outbound-prefix policy), the audit mirror records who approved what, and idempotency keys make retries safe. At 15–20 sends/week the manual gate is a feature for the story, not a burden.

Compliance, by jurisdiction and channel (checked 2026-11-05):

- US email (CAN-SPAM): opt-out is not required before a B2B cold send, but every message needs accurate headers, a non-deceptive subject, a physical postal address, and a working opt-out honored within 10 business days (15 U.S.C. §7704: https://uscode.house.gov/us/usc/119-136/t15/s7704/; FTC guide: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business). None of that machinery exists in the staged-email path — the draft template needs an identity block + opt-out line. Effort S. If the agent sends it, YOU are legally the initiator; the HITL record helps prove oversight but does not shift liability.
- Spain/EU email (Málaga): opt-in is the rule. LSSI art. 21 prohibits unsolicited commercial email absent prior consent, with a narrow exception for prior contractual relationships with similar goods/services plus opt-out at collection and in every message (https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758, art. 21, checked 2026-11-05). Unlike UK PECR there is no corporate-subscriber carve-out, so the UK ICO's B2B latitude (https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/) does NOT transfer to Spain. GDPR still applies: legitimate interest (art. 6(1)(f)) plus an unconditional right to object (art. 21) (https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679). Practical reading: the source's "Málaga stays walk-in + WhatsApp opt-in" is right; agent-sent cold email into Spain is not compliant without consent.
- WhatsApp: business-initiated messages outside the 24h customer-service window require an approved template; free-form is only allowed inside the window opened by the recipient's message (window mechanics: https://api.support.vonage.com/hc/en-us/articles/23794412588572, updated 2025-11-24; Meta policy requires opt-in: https://whatsappbusiness.com/policy/; template categories are per-message priced: https://whatsappbusiness.com/products/platform-pricing/, all checked 2026-11-05). No template is applied on this branch (.agents/docs/whatsapp-cloud-notes.md:117-127), the test number caps at 5 recipients, and dev tokens rotate every 24h. Cold WhatsApp is both non-compliant and technically refused. Warm in-window notifications and demo sauce: yes.
- Deliverability: keep the dogfood volume on a separate sending identity from the OTP/transactional Brevo domain (source's point G8 stands; seam at apps/api/src/mail.ts:38-57).

Risks, ranked: (1) legal exposure from agent-drafted cold sends (mitigated: warm-only + template footer + founder clicks); (2) domain reputation damage to OTP mail (mitigated: separate identity); (3) Meta account limits on the test number during a live demo (mitigate: Telegram as the reliable channel, WhatsApp as sauce — same call the beta plan made); (4) the demo shows staging-not-sending if gap 1 isn't closed (mitigate: close it first).

---

## 3. Recommendation

### Ranked top-5 for the next two weeks

1. Land W0–W2 from /tmp/tarima-plan.md (preview fixes, one-command dev/preview, tiered validation, CI on work/*). In flight already; everything else compounds on it. Don't start new surface before this merges.
2. Close the outbound loop: outbox drain-on-approve (email first via the Brevo seam) + `create_entity` + `set_brief` tools + instructions update. This is the demo's money shot (brief → curated rows staged → agent drafts → you click → it actually sends) and it unblocks dogfooding. Attach: agent-platform SP8 / W3 follow-on.
3. Make the 2-day demo: run `pnpm -C apps/api seed-venues`, script ONE Berkeley run per the plan's canonical eval case (evening event, 10–25 attendees, venue+food+AI-credits sponsors), record it, write the demo script doc, fix the dead `/app/p` link, put a "brief us in chat" opener in the panel. Attach: SP7 follow-up + a demo ticket.
4. Wire minimal GTM plumbing in one evening: PostHog cloud snippet (brief-form starts, approve-click as THE gated event, session replays), Tally pilot-brief form on the landing, Cal.com booking link on the follow-up path. Attach: landing/P6 stream or a standalone GTM ticket.
5. Run Approach A with a compliance hygiene pass: 15–20 founder calls/week merged with discovery; warm-only agent-assisted sends; add the identity + opt-out footer to the outbound template; keep a suppression list (a `gtm_contacts` table with consent + do-not-contact flags, contract-first in packages/contract). Attach: contract + db migration ticket; process side needs no code.

Explicitly NOT in the two weeks: negotiation/quote-engine build-out (P1/P2), observer-link revival (unless a named prospect demands it), WhatsApp template application (only when testers need out-of-window sends), Documenso, paid tooling.

### Minimal GTM stack (6 tools, pick + rejected alternative, ownership notes)

| Job | Pick | Self-host vs cloud | Data ownership | Rejected alternative + why |
|---|---|---|---|---|
| Analytics / replays / flags | PostHog cloud free | Cloud (free tier: 1M events, 5K replays; verified 2026-11-05, https://posthog.com/pricing) | Your event data lives on their cloud; MIT self-host exists if that ever matters; apply for startup credits (amount unverified) | Plausible: cleaner privacy story but no replays/funnels depth; you'd add a second tool |
| CRM / pipeline | Twenty self-host on the existing VPS | Self-host (AGPL core free; cloud is $9/user/mo with no free tier, verified 2026-11-05, https://twenty.com/pricing) | Full: your box, your backups via the existing Litestream pattern | HubSpot free: hoards data, upsell pressure, worst-case migration later. Rejected fallback from the source (bordered SQLite table) is fine only under ~10 deals |
| Scheduling | Cal.com cloud free | Cloud (free forever for 1 user, verified 2026-11-05, https://cal.com/pricing) | Booking data exportable; zero-ops | Calendly free: branding + limits; self-hosting Cal.com is NOT worth it at this stage |
| Pilot-brief intake + post-call surveys | Tally cloud free | Cloud (unlimited forms/submissions, verified 2026-11-05, https://tally.so/pricing) | Responses exportable (CSV); closed-source cloud, acceptable for non-sensitive briefs | Google Forms: worse ownership/export posture and looks wrong on a founder-led sales motion |
| Signatures / pilot commitments | Documenso self-host, DEFERRED until the first signature is actually needed | Self-host (AGPL; free cloud tier is only 5 docs/mo, verified 2026-11-05, https://documenso.com/pricing) | Full when self-hosted | DocuSign: paid, data leaves your box, absurd at POC stage |
| Contact enrichment | None yet; Apollo free tier when the warm list exceeds ~50 | Cloud (free tier specifics unverified 2026-11-05, https://www.apollo.io/pricing) | Contact reveals are credit-metered and leave with the vendor | Any paid prospecting tool now: wrong side of the source's own 100-contacts rule |

Recording: use the OS screen recorder (QuickTime); OBS/Loom only if async follow-ups materialize. Automation: none; two glue scripts don't justify n8n.

### Tickets for the dev plan (workstream each would attach to)

| Ticket | Workstream |
|---|---|
| Outbox drain-on-approve sender (email → whatsapp/telegram tools follow) | agent-platform SP8 completion; rides W3 (Chat SDK WhatsApp) once W0–W2 land |
| `create_entity` + `set_brief` agent tools + instructions update | SP3 agent core (P2 tool list) |
| Mount `/webhooks/*` (whatsapp + email inbound) in the single-process dispatcher | W3 / SP6 channels |
| Telegram inline approval buttons + `send_telegram` tool | SP8 (the vendored eve HITL support already exists) |
| Audit tab v1 (read `agent_events` + `approvals`) | SP9 / P5 (documents + audit tab) |
| Revive observer link in the new workspace (contract + table survive) | SP9 / deferred observer item in the 2026-11-04 plan |
| Fix dead `/app/p/$projectId` link in ProjectView | SP7 follow-up (trivial) |
| `gtm_contacts` contract schema + table (consent, do-not-contact, source) + outbound template footer | packages/contract-first addition; attaches to W3/channels (outbound-adjacent) |
| PostHog + Tally + Cal.com instrumentation on landing/app | Landing/P6 stream or standalone GTM-ops ticket |

---

## Verification appendix (all fetched 2026-11-05)

- PostHog pricing (1M events/mo, 5K replays free, free-forever FAQ): https://posthog.com/pricing
- Twenty pricing (Pro $9/user/mo, no free cloud tier, free self-host of open core): https://twenty.com/pricing
- Cal.com pricing (free forever, 1 user, unlimited links/calendars): https://cal.com/pricing
- Tally pricing (unlimited forms + submissions free): https://tally.so/pricing
- Documenso pricing (free = 5 docs/mo, 10 recipients): https://documenso.com/pricing
- Apollo pricing (entry plans exist; free-tier specifics not exposed to fetch): https://www.apollo.io/pricing
- Comtev live homepage (£79/mo claim, "You choose what gets booked"): https://comtev.com/
- BoomPop standalone site (acquisition claim NOT confirmed here): https://boompop.com/
- trynowadays.com is a THC-drink brand, not the YC planner: https://www.trynowadays.com/
- CAN-SPAM statute (15 U.S.C. §7704: opt-out mechanism, 30-day window): https://uscode.house.gov/us/usc/119-136/t15/s7704/
- FTC CAN-SPAM compliance guide (headers, subject, postal address, 10 business days): https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- Spain LSSI art. 21 (prior consent for commercial email; contractual-relationship exception): https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- ICO B2B marketing (UK PECR corporate-subscriber carve-out, contrast only): https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/
- GDPR consolidated text (arts. 6, 21): https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679
- WhatsApp 24h customer-service window mechanics: https://api.support.vonage.com/hc/en-us/articles/23794412588572-What-is-the-24-Hour-Customer-Care-Window
- WhatsApp Business Messaging Policy (opt-in requirement): https://whatsappbusiness.com/policy/
- WhatsApp Business Platform per-message pricing (4 categories): https://whatsappbusiness.com/products/platform-pricing/

Unverified and flagged above: PostHog survey-response free allowance and startup-credit amount; Cal.com self-host license change (Apr 2026); Twenty API/MCP claims; BoomPop/Navan acquisition price; EagleEye, Naboo, Always Friday, TeamOut figures; Comtev £250/event tier.
