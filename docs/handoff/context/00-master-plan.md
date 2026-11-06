# Tarima follow-up: close the chain, one-command dev, tiered validation, Chat SDK WhatsApp, eve memory

## Context

SP1-SP8 sit on `work/sp3d-mirror` @ 311be32 (pushed, validate-green, 52 commits ahead of `main`). The local preview works only through a hand-rolled recipe: `/tmp/e2e-run.sh` (Keychain key, 15 env vars), mocks started by hand, cwd has to be `apps/web`, and eve must be built separately. Several things are stale or broken:

- Root `package.json` `dev` still runs the dead two-process layout (`apps/api` is a library now).
- mise pins pnpm 11.21.0, but `packageManager` says 12.16.1.
- The CI `e2e` job runs `@tarima/e2e`, which no longer exists.
- CI only triggers on `main`/`beta/**`/PRs, so `work/*` pushes are never checked.
- `work/preview-fixes` (a43fb9d, the 2 preview fixes) is local only.
- sp6b (custom WhatsApp channel, mock seams) is stuck on lint/knip on the VPS.

The owner wants four things:

1. Reuse what the new-wave agent apps already solved instead of building variants from scratch.
2. Simple `dev`/`preview` commands.
3. Brioso-style tiered validation, so agent output can be trusted.
4. More impact per iteration.

Decisions taken:

- **WhatsApp:** swap to Chat SDK.
- **Orchestration:** add turbo under mise.
- **Memory:** move to eve memory in this round.

## Where tarima sits vs the references (research summary)

- **vercel-labs/personal-agent-template** (Nuxt, eve ^0.47) is the closest match. It does per-user memory with stock eve `defineMemory({ scope: byPrincipal })`, eve-native approvals, link codes from Slack/iMessage to app users, and "stranger" handling for unknown numbers. It has no audit mirror and its UI is Vue, so our React/AI Elements UI and approval mirror stay ours.
- **vercel-labs/kody-eve-template** (eve ^0.83) shows how to wrap any Chat SDK adapter as an eve channel (`agent/channels/resend.ts`: `chatSdkChannel` + an idempotency key per message), plus schedules, subagents, and principal-scoped storage guards.
- **Chat SDK** has an official `@chat-adapter/whatsapp` for the WhatsApp Business Cloud API, the same API our custom channel targets. It has no SQLite state adapter, so we write a small one. Sendblue/Photon (iMessage) are possible later.
- **CopilotKit OpenBot/OpenDots/OpenDuet and OpenMausBot** are different stacks: Bun/Postgres, CopilotKit Intelligence lock-in, or an Electron desktop app. Take UX ideas only:
  - "Allow once / Always allow / Refuse" approvals
  - an outbound sensitive-data check
  - a masked secret input
  - a single "decide and record" action gateway, which matches our mirror
  - a memory change journal with undo
- **Verified locally:** our vendored eve 1.0.0-rc.5 already exports `eve/channels/chat-sdk` and `eve/memory`, `eve/memory/scope` and `eve/memory/file`, so no eve upgrade is needed.

**Net:** tarima is not a redundant variant. Its edge is a multi-channel, self-hosted (VPS + SQLite) agent with an owned audit and approval record and a project workspace. What we hand-rolled that stock eve or Chat SDK covers: WhatsApp transport and memory. Both get replaced in W3 and W4.

## Workstreams (order: W0 → W1 → W2 → W3 ∥ W4 → W5)

Worktrees go under `~/.worktrees/tarima/<keywords>`, branched from the chain tip. Use conventional atomic commits with no co-author line.

### W0. Land the preview fixes and unblock CI (0.5d)

- Push `work/preview-fixes`. Drop the untracked `apps/web/tests/mocks/mocks.test.ts`, which imports the deleted `@tarima/channels`. W2's smoke test replaces it.
- Merge into `work/sp3d-mirror` with hooks on (no `--no-verify`).
- `.github/workflows/ci.yml`:
  - Add `work/**` to the push triggers.
  - Replace the dead `@tarima/e2e` job with the W2 smoke job.
  - Read the pnpm version from `packageManager` instead of hardcoding it.
- `mise.toml`: set pnpm to match `packageManager` (12.16.1).

### W1. One-command dev and preview (1d)

**Turbo.** Add `turbo` as a root devDependency, plus a `turbo.json` with these tasks:

- `typecheck`, which depends on `compile-messages` (the paraglide step, as brioso does with `intl:compile`)
- `lint`
- `test`
- `build`, with outputs `apps/web/dist/**` and `apps/web/.output/**`
- `build:eve`: a new web script, `node node_modules/eve/bin/eve.js build --skip-sandbox-prewarm`. It must run with cwd `apps/web`.

Set `concurrency: 4`. Use the local cache only for now; the VPS remote cache can come later, as in brioso.

**Root `package.json`.** Scripts become thin wrappers:

- `dev`, `preview` and `validate` call scripts.
- `typecheck`, `lint`, `test` and `build` call `turbo run …`.
- Add `"prepare": "lefthook install"`.
- Delete `dev:api` and `build:api`. Rewrite `build` to run web plus eve.

**`mise.toml` (the entry point people and agents use):**

- `[env]` with `_.file = ".env.local"` (gitignored). Commit an `.env.example` with the variables from `/tmp/e2e-run.sh` and safe local defaults: `DATABASE_URL=.data/dev.db`, `DEV_LOGIN=1`, loopback mail domain, mock base URLs, `TARIMA_EVE_PORT`.
- `setup`: `pnpm install`, copy `.env.example` to `.env.local` if missing, `lefthook install`.
- `dev`: `scripts/dev.ts` starts the mocks (`apps/web/tests/channels/mock-boot.mjs 3511 3512 3513`) and `vite dev` in `apps/web`, with prefixed logs and kill-on-exit.
  - eve output is built on demand by the existing `ensureEveBuild()` in `apps/web/agent/runtime.ts`.
  - The script prints the dev-login URL.
- `preview`: `turbo run build build:eve`, then `scripts/dev.ts --preview`, which runs `node dist/server/server/index.mjs` from `apps/web` plus the mocks.
- LLM key: `scripts/dev.ts` reads `BIFROST_VK` from the env, or else from Keychain (`security find-generic-password -s bifrost -w`). If neither exists, it falls back to the deterministic stub LLM the tests use. Check its env flag in `apps/web/tests/turn`.
- `mocks`: mocks only. `db:reset`: wipe `.data/`.
- Remove the stale `build:api`. Keep the `deploy:*` tasks as they are.

**Open check in W1:** confirm `vite dev` mounts the in-process eve runtime. `runtime.ts` has an "is build" guard. If dev mode can't host it, `dev` runs eve's `.output` on `TARIMA_EVE_PORT` as a second child process inside `scripts/dev.ts`. That is still one command.

### W2. Tiered validation for trustworthy agent output (1d)

Mirror brioso, sized for tarima:

| Tier | Task | Runs | Where |
|---|---|---|---|
| pre-commit | lefthook | manifests check, oxfmt on staged files (cheap, <3s) | git commit |
| quick | `mise run validate:quick` | `turbo run typecheck lint` (cached), oxfmt check, manifests | agent loop, ~10s cold, ~1s warm |
| full | `mise run validate` | quick + `turbo run test` + knip | pre-push, CI |
| smoke | `mise run verify:smoke` | boot the preview build with stub LLM + mocks on a temp DB → `/assets/*` 200, dev-login, create a session, one chat turn streams, telegram/whatsapp mock round-trip | CI, and required before an agent reports UI or runtime work done |
| e2e | `mise run test:e2e` | Playwright (`apps/web/tests/e2e/run.sh`) | on demand, nightly |

- **`scripts/validate.ts`:**
  - Route the typecheck, lint and test steps through one `turbo run … --continue` call (one call, as brioso does, to avoid the paraglide race).
  - Run the light steps in parallel.
  - Self-skip when `git diff origin/main...HEAD` has no TS/JSON/CSS/lock changes. Hard-fail if `origin/main` is missing in CI.
  - Write timings to `~/.local/share/tarima/gate-timings.json`.
- **`scripts/smoke.ts`:** new. Plain Node fetch, no browser, <60s. It reuses `tests/channels/mock-boot.mjs`. It would have caught both preview bugs (assets 500 and the `/eve/eve` 404).
- **CI:**
  - `validate` job: full tier with `fetch-depth: 0`.
  - `smoke` job: build, then `verify:smoke`.
  - `paths-ignore` for docs and `.agents`.
  - Nightly cron for e2e.
- **Repo `AGENTS.md`:** add a "Definition of done" section.
  - Use `mise run validate:quick` in the loop.
  - Before reporting, run `mise run validate`, plus `verify:smoke` when the work touches the runtime, agent or UI. Paste the summary lines.
  - Never use `--no-verify`. Never run two heavy gates at once.
  - Document the `mise run dev`/`preview` commands and the dev-login URL.

### W3. WhatsApp via Chat SDK, salvage sp6b (1.5d)

- **`apps/web/agent/channels/whatsapp.ts`:** `chatSdkChannel` from `eve/channels/chat-sdk`, plus `@chat-adapter/whatsapp`.
  - Pattern: kody-eve-template `agent/channels/resend.ts`. Use the WhatsApp message id as the idempotency key, turn streaming off, and chunk long replies.
  - Read the API in `packages/eve/dist/src/public/channels/chat-sdk/*` first.
- **`apps/web/agent/lib/chat-state-sqlite.ts`:** a Chat SDK `StateAdapter` on better-sqlite3 (same DB, own table). Model it on `@chat-adapter/state-memory`, which is vendored under `packages/eve/dist/src/compiled/`.
- **Identity:** reuse the `agent/lib/telegram-bind.ts` pattern for phone-to-user binding. Unknown numbers get the "stranger" treatment from personal-agent-template: no memory, no tools.
- **Mock seam:** check whether the adapter accepts an API base URL override. If it does, point it at `WHATSAPP_API_BASE_URL`. If not, intercept at the fetch level in the smoke test only.
- **From `work/sp6b-merge`:** cherry-pick only the `MAIL_API_BASE_URL` seam and the mock harness. Drop the custom channel. Fix the remaining lint errors (`src/lib/icons.ts` empty export, `dev-login.ts` scoping) and the stale knip ignores while porting.
- **Check before deleting the custom code:** media messages and the 24-hour window, against `.agents/docs/whatsapp-cloud-notes.md`.

### W4. Memory on eve `defineMemory` (1d)

- Read the `eve/memory` provider interface (`packages/eve/dist/src/public/memory*`).
- Implement a SQLite provider in `apps/web/agent/lib/memory-sqlite.ts`, or use `eve/memory/file` with a `.data/memory` dir if the provider interface is heavy. Pick SQLite if it is under ~150 lines, since Litestream already backs it up.
- Wire `defineMemory({ provider, scope: byPrincipal })` in `apps/web/agent/agent.ts`. The principal comes from the existing AuthFn in `agent/channels/eve.ts` and the telegram bind, so memory is shared across channels for one user.
- Hook memory writes into the audit mirror (`agent/hooks/mirror.ts`) so changes are recorded, as the first step toward the change journal.
- Tests: principal isolation (user A never recalls B's memory), stranger gets no memory, and recall survives a session restart.

### W5. Bookkeeping

- `.agents/plans/2026-11-04-agent-platform.md`:
  - Update decision 11 (custom WhatsApp → Chat SDK adapter) and the memory decision (→ eve `defineMemory`).
  - Mark the SP status.
  - Add a "borrowed ideas" backlog: approval wording, outbound sensitive-data check, masked secrets, link codes, memory journal with undo, morning brief.
- Append to `_own/.agents/decisions.md`:
  - `tarima: chat-sdk whatsapp over custom channel`
  - `tarima: turbo under mise over plain pnpm -r`
  - `tarima: eve defineMemory over custom memory`
- Update the memory files `tarima-sp-chain-state.md` and `tarima-local-preview.md`, the latter to point at `mise run preview`.

## Verification

- Fresh clone, then `mise run setup && mise run dev`: the app loads on :3000, the dev-login URL works, and a chat turn streams, with the stub LLM when there is no Keychain key.
- `mise run preview` reproduces today's verified preview without `/tmp/e2e-run.sh`.
- `mise run validate:quick` is ~1s warm (turbo cache hit). `mise run validate` is green. `mise run verify:smoke` is green. Then re-break the `/eve/eve` fix locally to confirm smoke fails.
- CI on a `work/*` push runs validate + smoke and both are green.
- WhatsApp: a smoke round-trip through the mock (inbound webhook → agent reply → outbound to the mock), a duplicate message id is processed once, and an unknown number gets the stranger reply.
- Memory: unit tests pass, and in the browser, a fact saved in one session is recalled in a new one and is not visible to a second dev-login user (playwright-cli).
