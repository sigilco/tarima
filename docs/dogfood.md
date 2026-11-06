# Dogfooding tarima: from fresh clone to first real event

This is the shortest path from `git clone` to a real agent turn, plus the
"Berkeley decision-models" scenario used to exercise the whole loop:
project → sponsor search → board → approved outreach → captured mail →
memory across restarts.

Everything below assumes macOS + [mise](https://mise.jdx.dev). On Linux,
install Node 24 and pnpm 12.16.1 yourself (`mise install` still works).

## 1. Fresh clone → running app

```sh
git clone <repo> tarima && cd tarima
mise install          # node 24 + pnpm 12.16.1 (versions pinned in mise.toml)
mise run setup        # pnpm install, copies .env.example → .env.local, git hooks
mise run doctor       # sanity: env vars (names only), ports, DB, providers
mise run dev          # vite dev on :3000 + channel mocks + on-demand eve build
```

`mise run dev` prints three URLs when healthy:

- app: `http://127.0.0.1:3000`
- eve runtime health: `http://127.0.0.1:4310/eve/v1/health`
- **dev-login**: `http://127.0.0.1:3000/api/dev/login?email=you@tarima.test`

Open the dev-login URL once — it mints a session cookie and drops you
into `/app`. That is the whole login; no email is sent for `*.test`
addresses.

`mise run doctor` exits non-zero only on blockers (wrong Node, missing
pnpm/deps, a needed port already bound, DB not writable). Missing
optional vars are listed as `miss`, never fatal — with no LLM key the
agent answers with a deterministic stub, which is enough to exercise
the UI and mocks but is **not** real intelligence.

## 2. Environment variables

`.env.example` is the audited list — every var first-party code reads is
documented there (a test fails the build otherwise). Values you set go
in `.env.local` (gitignored). `mise run doctor` shows present/missing by
name only.

| Var | Needed for | Default | Where to get it |
|---|---|---|---|
| `DATABASE_URL` | SQLite file | `tarima.db` (example sets `.data/dev.db`) | any path you choose |
| `DEV_LOGIN` | instant dev login | on outside production | n/a |
| `BETA_ALLOWLIST` | restrict logins to emails | empty = open | your user emails |
| `SESSION_SECRET` | session cookie signing | insecure dev value | `openssl rand -hex 32` |
| `EMAIL_LOOPBACK_DOMAINS` | mail captured locally instead of sent | `tarima.test` | n/a |
| `MAIL_FROM` | outbound sender address | `notifications@tarima.illo.fyi` | your domain |
| `BREVO_API_KEY` | real outbound mail (Brevo) | unset → loopback/stdout | brevo.com dashboard |
| `INBOUND_WEBHOOK_SECRET` | inbound email webhook auth | unset → rejects | you choose it |
| `WEB_PORT` | vite dev / preview port | `3000` | n/a |
| `TARIMA_EVE_PORT` | in-process eve runtime port | `4310` | n/a |
| `BIFROST_VK` | **real LLM replies** via Bifrost gateway | unset → Keychain `bifrost` → stub | your Bifrost virtual key |
| `BIFROST_BASE_URL` | LLM gateway URL | `http://127.0.0.1:8317/v1` | your Bifrost deployment |
| `TARIMA_AGENT_MODEL` | gateway model id | `zai-coding-plan/glm-5` | Bifrost model list |
| `TELEGRAM_BOT_TOKEN` | live Telegram channel | unset → channel idle | @BotFather |
| `TELEGRAM_WEBHOOK_SECRET_TOKEN` | Telegram webhook check | unset | you choose it |
| `TARIMA_TELEGRAM_API_BASE_URL` | Telegram Bot API override (mock seam) | unset | n/a (tests) |
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_APP_SECRET` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_VERIFY_TOKEN` | live WhatsApp Cloud API (agent channel) | dev placeholders → effectively off | Meta for Developers app |
| `WHATSAPP_API_BASE_URL` / `WHATSAPP_API_URL` | WhatsApp Graph API override (mock seam) | mock `:3512` under `mise run dev` | n/a |
| `WHATSAPP_TOKEN` (+ `PHONE_NUMBER_ID`/`APP_SECRET`/`VERIFY_TOKEN`) | api-side WhatsApp outbound | unset → off | same Meta app |
| `CAUCE_BASE_URL` | sponsor search + venue enrichment (local service) | `http://127.0.0.1:4479` | run the cauce pipeline locally |
| `GOOGLE_MAPS_API_KEY` + `GOOGLE_PLACES_ENABLED` | Google Places tier | **off** | Google Cloud console |
| `FSQ_API_KEY` | Foursquare venue details | unset → off | foursquare.com developer |
| `VITE_API_ORIGIN` / `VITE_SITE_ORIGIN` | browser API origin / canonical origin | dev server itself | n/a locally |
| `LOG_SINK` / `LOG_LEVEL` / `LOG_FILE` | LogTape sinks | console / info / `.logs/tarima.jsonl` | n/a |

**Required for `mise run dev` with the stub LLM: nothing.** Everything
has a safe local default. For *real* agent replies you need
`BIFROST_VK` (env or the macOS Keychain item `bifrost`, which
`scripts/dev.ts` checks automatically). For real mail you need
`BREVO_API_KEY`; for real channels you need the Meta/Telegram creds
above.

## 3. The Berkeley decision-models scenario (10 steps)

Goal: run one full chase loop — project, web sponsor discovery, board
updates, approved outreach, captured reply path, memory — against the
Berkeley "AI credits for decision models" theme. With the stub LLM the
agent only echoes, so steps 4–6 need `BIFROST_VK` (or Keychain) and,
for step 5, a running cauce at `CAUCE_BASE_URL`.

1. `mise run setup && mise run doctor && mise run dev`; open the
   dev-login URL it prints.
2. On `/app`, create a project named e.g. `Berkeley decision-models
   meetup` (the goal/brief is free text — mention city=Berkeley,
   ~40 people, Tue 18:00–20:00).
3. In the project chat, ask: *"Find sponsors — AI companies that support
   Berkeley tech meetups or fund developer events."* The agent calls
   `search_sponsors`, which queries cauce `/api/search` and returns
   ranked official-site pointers (never invented contacts).
4. Ask it to add the two most relevant results as candidates
   (`add_candidate`) and report their board status.
5. Ask: *"List venues in Berkeley"* → `list_venues` reads
   `venue_catalog`. On a fresh DB it is empty until seeded — seed with
   `pnpm -C apps/api seed-venues` (SF + Málaga rows today; Berkeley
   coverage depends on the seed data, so expect an honest "nothing for
   Berkeley" if absent).
6. Ask it to draft outreach to a sponsor (`send_email` always raises an
   approval card — approve or refuse; nothing sends silently).
7. On approve, the mail goes to the loopback sink because
   `*@tarima.test` is in `EMAIL_LOOPBACK_DOMAINS`: verify it landed in
   `loopback_inbox` (sqlite browser or the mail mock log `[mock:mail]`).
8. Stop dev (`ctrl-c`), `mise run dev` again, open the same project and
   ask *"what did we decide about sponsors?"* — eve memory
   (`defineMemory`, principal-scoped) should recall the earlier turn.
9. `mise run verify:smoke` — boots the preview build on a temp DB and
   asserts assets, dev-login, a streaming turn, and mock round-trips.
10. `mise run validate` — the full gate (typecheck, lint, format,
    tests, knip). Green before you call the dogfood done.

## 4. Known limits

- **No live WhatsApp number.** The Cloud API channel works against the
  mock (`WHATSAPP_API_BASE_URL` → `:3512`) with dev-placeholder creds;
  real sends need the Meta app creds and a real `phone_number_id`.
- **Google tier is off by default.** `GOOGLE_PLACES_ENABLED` must be `1`
  *and* `GOOGLE_MAPS_API_KEY` set; Enterprise masks additionally need
  `GOOGLE_PLACES_FIELD_TIER=enterprise` and stay under daily caps.
- **Stub LLM is not smart.** Without `BIFROST_VK`/Keychain the agent
  replies `Stub reply: <your message>` — fine for wiring checks, useless
  for real chase work.
- **`web_search`/`web_fetch` are unverified** on the Bifrost/GLM model
  (eve resolves OpenAI's hosted search, which the gateway may ignore).
  `search_sponsors` via cauce is the reliable discovery path.
- **No live Telegram/WhatsApp inbound** without real creds *and* a
  publicly reachable webhook URL — locally only the mocks answer.
- **Mail to real addresses does nothing** without `BREVO_API_KEY`
  (logged to stdout); `*@tarima.test` always lands in `loopback_inbox`.
- **Venue catalog is seed-driven** (`pnpm -C apps/api seed-venues`);
  live geo discovery providers were removed in SP7 — `list_venues` only
  knows what the catalog tables contain.
