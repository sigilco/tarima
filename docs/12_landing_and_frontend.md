# Landing page + frontend direction — Tarima

Source of truth: `tarima-refinement.md` (post-pivot). Research: Instinct, muse.ai/business, x.ai/bot, Mobbin (Clay, Sana, Harvey, Lindy, Unify, Relevance AI, Base44).

## The product (one paragraph)

Tarima is the multiplayer back-office agent for events — the missing half of Luma. It lives where organizers already work (chat + web workspace) and runs the two highest-friction external loops on one engine: **Mode 1** venue & vendor sourcing (emails/calls venues, parses quotes into a comparison board) and **Mode 2** sponsor/speaker/vendor chasing (hunts logos, invoices, slides, contracts). Every row is an external entity; every column is a goal state; the agent fills cells by working email, voice, and messaging channels — with HITL gates so it never commits without human sign-off.

## What the references actually say (verified)

| Reference | What it is | What to take |
|---|---|---|
| **Instinct** (instinct.com, tweets [1](https://x.com/noahrshinn/status/2092691344456351744) [2](https://x.com/noahrshinn/status/2100262985491231101), [Verge](https://www.theverge.com/tech/1008254/instinct-agent-ai-hands-on-muse-dots)) | Invite-only personal agent. Site is a single page of plain text — no screenshots, no feature grid. "No new interfaces": iMessage/WhatsApp/email. Founder Shinn: north star is *understandability*, not capability — messages front-load the important line. Instinct Concierge adds real phone calls as a "white glove" tier rolling out to early access. | The interface question is distribution, not design. Minimal confidence in the landing. Concierge framing = "the agent really makes calls" is *the* proof asset. |
| **Muse for business** (muse.ai/business) | AI agent for small business. Approve-before-it-acts + complete audit trail; connects the tools you already use; keeps working in the background; FAQ-heavy. | Copy patterns: "Stay in control of what your agent does" → our HITL gates. Audit log = trust feature, show it. |
| **Grok Bot** (x.ai/bot) | "AI teammates that finish the work." Message bots like teammates; give each Bot a job (Sales Outbound, Talent Scout, ...); watch them act; they come back when approval is needed. Warm light neutrals, soft cards. | "Give each Bot a job" maps 1:1 to our workflow templates (Source venues / Chase sponsors). Approval-return is exactly our HITL loop. Warm light palette. |
| **Clay Nexus** (Mobbin) | Dark hero, huge serif wordmark, one "GET EARLY ACCESS" pill, a single chat-card showing a real drafted email. | Proof-in-hero: show one real artifact, not six features. |
| **Sana** (Mobbin) | Dark + serif italic accent + single lime accent + product montage on a monitor. | One accent color, serif display type, product-as-hero. |
| **Harvey** (Mobbin) | Warm dark editorial photo, "Join the Waitlist" white button. | Waitlist CTA can be dead simple. |
| **Lindy** (Mobbin) | Chat left, agent computer/browser right — split-pane execution view. | The "watch it work" split: chat ↔ live state. |
| **Unify** (Mobbin) | Chat left → converts to a live record table right. Suggested next actions under each reply. | Our hero artifact: brief in chat → board fills. |
| **Clay table** (Mobbin) | Dense white table where columns ARE agent runs ("map agent inputs" side panel). | The cell-filler board is literally our data model. |
| **Relevance AI** (Mobbin) | Clean light task queue, "Pending approval" pills on each agent task. | HITL as a first-class UI element, not a settings page. |
| **Base44 / HubSpot / Gumloop** (Mobbin flows) | Agent-creation wizards: name → job/template → connect → first task, 5–8 screens. | Onboarding shape for "set up your agent". |

## Style direction

**"Luma meets Attio/Clay, editorial light mode."** Deliberately not dark sci-fi (docs say avoid) and not bare-text Instinct (we need to show a product, not just promise one).

- **Palette:** warm off-white paper (`#FAFAF7` range), ink near-black, ONE accent — a warm terracotta/clay red (nods to the name: tarima = wooden stage/platform) or a deep green. No gradients, no glow.
- **Type:** serif display for headlines (Instrument Serif — free, the current editorial default), Inter/Geist for UI. Italic accent word inside headlines (the Sana/Clay move).
- **Hero artifact:** a live mini-board animating — a brief goes in, rows populate as "the agent" calls/emails: status pills cycle `Calling → Replied → Quoted → Awaiting approval`. This IS the pitch; screenshot-not-video so it reads instantly.
- **Voice/audio:** when real call recordings exist, embed a small player + transcript. Until then, a styled transcript block (no fake audio).
- **CTA:** inline email field + "Request access" — not a button that opens another page. Secondary CTA: "See how it works" anchor.

### Page structure (5 sections)

1. **Hero** — wordmark, one-line pitch ("The operations agent for events — it calls venues and chases sponsors so you don't have to"), email capture, mini-board animation.
2. **Two jobs** — the mode toggle: Tab 1 Venue sourcing (board of venues with price/capacity cells filling), Tab 2 Sponsor chasing (board of sponsors with logo/invoice/slides status pills). Same board, different columns — shows one engine.
3. **How it works** — 4 steps: Brief it → it works email/phone/chat → board fills → you approve, it executes. HITL callout.
4. **Why it's different** — 3 honest lines vs. the field (not enterprise-gated like Planned, not an agency like Nowadays, not a wrapper — it does the work in your channels). Proof strip (metrics/transcript placeholder).
5. **Pricing teaser + FAQ + footer** — "free while in early access for organizers", line for venues/agencies.

## Frontend architecture

User constraints honored: self-hostable, local-first, Web Standards, EN-only with i18n for copy.

- **App: TanStack Start** (not Astro). The platform site is an app (auth, onboarding, live board, chat); Start gives SSR + server functions + TanStack Router/Query/Table in one paradigm. The landing page is just a static prerendered route of the same app — no second stack to maintain. Astro would be right if the landing were standalone and the app lived elsewhere — it doesn't.
- **Backend: Hono + SQLite + Drizzle**, separate service in dev (`apps/api`), frontend proxies `/api` in dev; in prod either process can serve the built assets (both Web-Standard stacks) or Hono serves `dist/client`. Drizzle schema = the product's real data model (entities, goals, runs, approvals) from day 1.
- **Auth: better-auth** (email/password, Drizzle adapter, self-hostable, maintained). Don't hand-roll sessions.
- **Request access:** `POST /api/access-requests` → SQLite row + transactional mail via Brevo HTTP API behind a `sendMail()` seam (swappable to CF Email Workers later — both are env-var config, not architecture).
- **i18n:** `paraglide-js` (inlang) via Vite plugin — typesafe `m.xxx()` calls, copy lives in `messages/en.json`, compiles to per-locale modules. Adds locales later for free; satisfies "manage copy separately" without shipping a second language.
- **UI:** Tailwind v4 + shadcn/ui (semantic tokens, light theme) + TanStack Table for the board surface. Copy strings only via paraglide — no hardcoded marketing text.
- **Repo layout:** `apps/web` (TanStack Start) · `apps/api` (Hono+drizzle) · `packages/copy` — pnpm workspaces.

## The messaging question: internal chat now, messaging apps later

Recommendation: **build the internal chat first** — with a channel seam.

- Instinct's lesson isn't "be on WhatsApp" — it's *don't make users learn a new interface* (and Shinn had Sierra's team + $10B valuation to get WhatsApp/iMessage plumbing right). Tarima's multiplayer surface is the state board anyway; the chat can't replace it (the doc's own anti-pattern: "chat-only trap" — TeamOut's CTO admitted chat-only frustrated power users).
- WhatsApp Business API needs entity verification, template approvals, and per-message pricing — slowest possible week-1 dependency. Baileys is ToS-gray. Telegram Bot API is free/instant and is the realistic first external channel.
- **Seam design:** internal chat IS the canonical thread per event; an outbound-channel adapter (email now → Telegram next → WhatsApp post-entity) posts the same status updates wherever the team already lives. So "lives in your WhatsApp group" stays marketing-true in steps, not day-1 debt.
- Onboarding then mirrors Grok Bot's "give each Bot a job": name your event → pick a job (Source venues / Chase sponsors & speakers) → paste or link your contact sheet → approve the agent's first outbound batch. 4 steps, not 8.

## Anti-checklist (do NOT do)

- No dark-mode glowing orb, no "150+ AI tasks", no feature-grid bloat, no fake logos, no Book-a-Demo.
- No "AI" wallpaper copy; show the work (board, transcript, approvals).
- No chat-only product surface — chat = notifications/approvals; board = state.
- Don't claim "agent-callable API" until the endpoint is literally live (adversarial investor note).
