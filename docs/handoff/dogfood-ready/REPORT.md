# Batch 7 report: dogfood-ready

Branch `batch/dogfood-ready`. Scope: docs + config only; no runtime
behavior changed.

## What shipped

1. **`docs/dogfood.md`** — fresh clone → first real event:
   `mise install` → `mise run setup` → `mise run doctor` → `mise run dev`,
   the dev-login URL, a required-vs-optional env var table (var, needed
   for, default, where to get it — no values), the Berkeley
   decision-models scenario as a 10-step script (sponsor search via
   cauce → `add_candidate` → `send_email` approval → loopback inbox →
   memory recall across restart → `verify:smoke` → `validate`), and known
   limits (no live WhatsApp number, Google tier off by default, stub LLM
   caveat, unverified `web_search`, seed-driven venue catalog).
2. **`scripts/doctor.ts` + `mise run doctor`** — reports every env var
   tarima reads as set/missing by name only (never values), checks Node
   24, pnpm, installed deps, the five dev ports (3000/4310/3511–3513),
   and DB writability; then classifies providers live / replay / off /
   unknown (LLM, mail in/out, Telegram, WhatsApp agent + outbound, cauce
   with a TCP probe, Google Places, Foursquare). Exit non-zero only for
   blockers. Loads `.env.local` itself so `node scripts/doctor.ts` works
   outside mise.
3. **`.env.example` audit** — rewritten from 19 to ~90 documented vars.
   `scripts/env-audit.ts` extracts env reads across all first-party
   access patterns (`process.env.X`, `import.meta.env.X`, bracket +
   const-indirect reads, `env.X` ProcessEnv aliases, `getEnv()`/`envInt()`
   string keys) over `apps/`, `packages/` (minus vendored `packages/eve`),
   `scripts/`; `apps/api/src/lib/repo-doctor.test.ts` runs the real repo
   scan in vitest and fails when a read var is missing from `.env.example`
   and not on the small platform allowlist (`CI`, `NODE_ENV`, `NITRO_*`,
   `WORKFLOW_LOCAL_BASE_URL`). Cloudflare worker deployables
   (`apps/inbound-worker`, `apps/web/public/_worker.js`) are excluded —
   their `env` is bindings, documented in their own AGENTS.md.

## Gate summary lines

- `mise run doctor` (this worktree, no `.env.local`): lists all env vars
  as `miss`, providers mostly `off`/`REPLAY`, exits 1 with 5 blockers —
  all five dev ports are genuinely bound by another running dev instance
  on this machine. On a clean clone with free ports the same run exits 0.
- Pre-commit `validate --quick`: `all steps passed
  [turbo(typecheck+lint)=66261ms, oxfmt=869ms, manifests=164ms]`.
- Pre-push `pnpm validate` (full): `all steps passed
  [turbo(typecheck+lint+test)=25271ms, oxfmt=277ms, manifests=154ms,
  knip=24831ms]` — includes the new `repo-doctor.test.ts` (16 tests).
- `verify:smoke` not run: no runtime/API/UI code changed (docs, scripts,
  test, env example, mise task only).

## Deviations

- "Berkeley decision-models scenario" was not a named artifact anywhere
  in the repo; I interpreted it from `docs/handoff/context/tarima-scout.md`
  ("AI credits for decision models" sponsor-search example) and wrote the
  10 steps around what actually ships: `search_sponsors` (cauce),
  `add_candidate`, `list_venues`, `send_email` approval, loopback mail,
  eve memory recall.
- Doctor treats occupied dev ports as blockers (they prevent
  `mise run dev`); everything else env-related is informational.
- `TELEGRAM_BOT_TOKEN`/`TELEGRAM_WEBHOOK_SECRET_TOKEN` are read inside
  vendored `packages/eve` (excluded from the scan) but are documented in
  `.env.example` anyway since the Telegram channel needs them live.

## Undocumented vars

None. The repo-scan test reports zero env vars read in first-party code
that are missing from `.env.example` or the allowlist.

## Left / notes for the orchestrator

- `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`
  appear in two `.env.example` sections (agent channel vs `@tarima/channels`
  outbound) — same Meta app, different token shapes; comments explain.
- `scripts/dev.ts` sets `TELEGRAM_API_BASE_URL` while the agent channel
  reads `TARIMA_TELEGRAM_API_BASE_URL`; both are documented (pre-existing
  seam naming, not changed).
