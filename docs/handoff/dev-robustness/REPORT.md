# dev-robustness — report

Branch: `vps/dev-robustness` (base `origin/work/integrate-sp` @ 6e07320).

## Shipped

1. **`mise run dev` no longer proxies `/api` to :3001.** Root cause found
   while reproducing: the API is mounted in-process by the nitro server
   entry (`apps/web/src/server.ts` → `buildApiHandlers`); there is no API
   child and no `apps/api` dev server in `scripts/dev.ts` on any branch.
   The vite `server.proxy` to `http://localhost:3001` was stale. It only
   bit requests the nitro dev middleware skips — `/api/dev/login?email=…@tarima.test`
   always matches nitro's "looks like a static-asset extension" check
   (`.test` at end of URL) and fell through to the proxy, so dev-login was
   answered by whatever occupied :3001 (stale `tarima.service` → SSR 404;
   free port → 502). `apps/web/vite.config.ts` drops `server.proxy`
   entirely; the nitro post-hook middleware then serves those requests
   in-process. Verified: dev-login returns **302** with the real stale
   `tarima.service` still listening on :3001.
2. **Free-port selection in `scripts/dev.ts`.** New `scripts/dev-ports.ts`
   (`pickFreePort(start, probe, maxAttempts)`, injectable probe) picks a
   free port for the web server (default `WEB_PORT`/3000) and the eve
   runtime (default `TARIMA_EVE_PORT`/4310), probing upward. A taken
   default prints one line, e.g. `[dev] web port :3000 already in use;
   using :3002`. Startup summary now prints the actual ports plus
   `api: in-process on :<port> (same server; no :3001 dependency)`.
   Unit test: `apps/api/src/lib/dev-ports.test.ts` (4 tests, injected
   probe, no sockets).
3. **mise turbo fix.** `tasks.build` and `tasks.build:web` now call
   `pnpm turbo run …` (same idiom as `test:memory-e2e`); bare `turbo` in
   mise tasks failed on hosts without a global install. Grep found no
   other bare `turbo` in mise.toml; root `package.json` scripts are fine
   (they run under pnpm, which puts `node_modules/.bin` on PATH).
4. **`mise run test:whatsapp-roundtrip`** runs
   `apps/web/tests/turn/whatsapp-run.sh` (the script builds the eve
   runtime and web dist itself when missing). Documented in AGENTS.md
   Definition of done as an opt-in check and in Commands.

## Deviations from the brief

- The brief assumed an "API child" and a `TARIMA_API_PORT` proxy target.
  No such child exists: the API is in-process inside the web/nitro
  server, so there is no API port to pick and keeping any proxy would
  reintroduce the bug (verified: proxy→dead port still 502s dev-login).
  Port picking was applied to the ports dev.ts actually owns (web, eve).
- The :3001 occupant during the gate was the real stale `tarima.service`
  already on this VPS (the exact reported scenario), not a
  `python3 -m http.server` I started; :3000 was deliberately occupied by
  my own `python3 -m http.server 3000` (PID 4098663, killed after).

## Gate output

- `mise run validate` (ran inside pre-push hook, twice):
  `validate: all steps passed [turbo(typecheck+lint+test)=15625ms, oxfmt=317ms, manifests=325ms, knip=14976ms]`
  — includes `src/lib/dev-ports.test.ts (4 tests)` passed; api suite
  202 tests, web suite 62 tests, all green.
- `mise run build`: `Tasks: 4 successful, 4 total` via
  `pnpm turbo run build build:eve` (previously `sh: turbo: not found`).
- `mise run verify:smoke`:
  `smoke: 7/7 checks passed [port 3900, eve 4390]`
  (`dev-login — status 302` among them).
- `mise run dev` with :3001 occupied by stale tarima.service AND :3000
  occupied by my python http.server:
  `[dev] web port :3000 already in use; using :3002`
  `dev-login -> 302`, `/api/health -> 200` on :3002.
- `mise run dev` with only :3001 occupied: dev-login -> 302 on :3000.

## What is left

- Nothing blocking. `test:whatsapp-roundtrip` was added but not executed
  (opt-in per AGENTS.md; it builds web+eve and boots a throwaway stack —
  untouched areas). Worth one manual run before relying on it in CI.
- Pre-existing noise: vite dev SSR emits repeated "dynamic import cannot
  be analyzed" warnings from `.output` chunks; unrelated to this change.
