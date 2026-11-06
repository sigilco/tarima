# dev-probe handoff

Branch `vps/dev-probe` on `origin/work/integrate-sp` base `4648692`. Two deliverables: bound the dev readiness probes, and fix the post-build dev 500 on `GET /` at its root cause. `mise run preview` was exercised and the full gates are green.

## Shipped

- `scripts/dev-probe.ts`: new helper that runs each readiness fetch under `AbortSignal.timeout` (3s per request) and retries until the overall deadline, so a single hung request can no longer stall the banner.
- `scripts/dev.ts`: readiness checks (health probe, dev-login probe, about section) now use the bounded helper.
- `apps/api/src/lib/dev-probe.test.ts`: unit test with an injected fetch that hangs once then answers; asserts the second attempt succeeds and readiness completes.
- `apps/web/nitro-dev-main.ts` + `apps/web/vite.config.ts`: dev-only Nitro plugin that anchors `globalThis.__nitro_main__` to `apps/web/node_modules/.nitro/dev/index.mjs` and re-asserts it on every request via a `request` hook.
- `apps/web/src/server.ts` and `apps/web/agent/runtime.ts`: establish the dev anchor when needed, and save/restore the web value around the eve dynamic import.
- `knip.json`: registered `nitro-dev-main.ts` as an entry.

Commits: `48729ef fix(dev): bound readiness probes and anchor nitro dev __nitro_main__`, `c5125a2 fix(dev): re-assert nitro dev __nitro_main__ on every request`.

## Root cause of the post-build 500

After `pnpm turbo run build build:eve --filter=web`, `GET /` returned 500 with `ENOENT .../apps/dist/client/index.html` (one level above `apps/web/dist/client`). Nitro stores public asset paths relative to `dirname(globalThis.__nitro_main__)`. In dev the web Nitro bundle never sets that global, and the eve runtime's dynamic import of `.output/server/index.mjs` can claim it, so assets resolved relative to the eve output and produced `apps/dist/client`. The plugin anchors the global to the dev Nitro entry and re-asserts it per request to close the race window during the multi-second eve import; `runtime.ts` additionally saves/restores it across the import.

## Gate output (real)

Targeted tests:

```
apps/api/src/lib/dev-probe.test.ts + dev-ports.test.ts: 2 files passed, 8 tests passed
```

Post-build dev check (`mise run dev` after build, `GET /` repeated):

```
200 200 200 200 200 200   (/)   /api/health 200   /mark.png 200   dev-login 302
```

Pre-build dev check (dist removed): `/ -> 200`, `/api/health -> 200`, `/mark.png -> 200`, dev-login 302.

`mise run preview` (built app, `node scripts/dev.ts --preview`):

```
[llm] no BIFROST_VK (env or Keychain): deterministic stub LLM
[web] ➜ Listening on: http://localhost:3000/ (all interfaces)
  tarima:    http://127.0.0.1:3000
  eve:       http://127.0.0.1:4310/eve/v1/health
  dev-login: http://127.0.0.1:3000/api/dev/login?email=you%40tarima.test
```

Wire checks against preview on :3000: `GET / -> 200`, `dev-login -> 302` (`location: /app`, `set-cookie: tarima_session=...`), `POST /api/eve/eve/v1/session -> {"ok":true,"sessionId":"wrun_01M6R99FYRR5AQTAWR923ER51N",...}`, `GET .../stream` emitted `model.started` (`openai/zai-coding-plan/glm-5`) and `content.delta` with `Stub reply: Say hello from the smoke gate.` — stub LLM confirmed streaming.

`mise run verify:smoke`:

```
OK   web health
OK   landing + asset — /assets/styles-Bwl1Hx63.css
OK   dev-login — status 302
OK   eve session via proxy — status 202
OK   session stream opens — status 200
OK   chat turn streams — 370 bytes
OK   channel mocks up — tg 404 wa 404

smoke: 7/7 checks passed [port 3900, eve 4390]
```

`mise run validate` (also run by the pre-push hook on the pushed head):

```
validate: all steps passed [turbo(typecheck+lint+test)=17444ms, oxfmt=355ms, manifests=359ms, knip=16721ms]
```

## Deviations

- First `mise run validate` failed on Knip (`apps/web/nitro-dev-main.ts` unused); fixed by adding it to `knip.json` entries.
- Anchoring `__nitro_main__` once was not enough: eve's import can overwrite it mid-request. Diagnosed via temporary nitro instrumentation (removed before commit) and closed with the per-request reassert in `c5125a2`.
- An early real `mise run dev` check still showed intermittent 500s during the eve import window before the request-hook fix; after it, repeated `GET /` returned 200 consistently.
- `AGENTS.md` workaround path was not needed; the bug was fixed in repo code, not upstream.

## Remaining work

None. All processes started were stopped by exact PID; only `vps/dev-probe` was pushed.
