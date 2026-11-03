# End-to-end tests

Two suites, one harness. Both prove the product loop: login, create a project, import rows, start the chase, a reply comes back, the board moves.

## The api-level suite (the gate)

`src/api/` drives the real api process over HTTP, with the loopback mail domain and the deterministic stub LLM. No real email is sent and no model is called.

```sh
pnpm --filter @tarima/e2e test
```

It runs as part of `pnpm validate`, so it is the pre-push gate and the CI gate.

The suite boots its own api process against a throwaway sqlite file. The helpers in `src/api/helpers/` do the work:

| helper | what it does |
| --- | --- |
| `server.ts` | boots the api process, waits for `/api/health`, tears it down |
| `client.ts` | the HTTP client, the login flow, the loopback inbox reader |
| `reply.ts` | injects a reply on `POST /webhooks/email`, the way the Cloudflare email worker does |
| `db.ts` | reads the sqlite file directly for the status and result assertions |
| `wait.ts` | polls a condition instead of sleeping a fixed amount of time |

The assertions read the database, not the wire shapes. The db status vocabulary (`pending`, `intake`, `chasing`, `await_reply`, `parsed`, `validated`, `updated`, `notified`, `done`, `failed`) and the `entities.result` bag are the stable facts about a row. The api translates the db vocabulary to the wire vocabulary on the way out, so a wire assertion would break whenever the translation changes.

## The browser suite (the laptop gate)

`ui/` drives the real board ui in a real browser. It runs against the production-shaped server: the api process with the built web bundle behind it, so the ui, the api and the ssr shell share one origin, exactly as in production.

The vite dev server is not used on purpose. The TanStack Start dev plugin does not serve the ssr shell in this setup, so the browser suite would test a half-working app.

```sh
pnpm --filter @tarima/e2e exec playwright install chromium   # once
pnpm --filter @tarima/e2e test:ui
```

`test:ui` builds the artifact first, then runs Playwright. Add `--headed` (through `test:ui:headed`) to watch the browser.

This suite is not in CI: it needs the browser binaries and a built bundle, and it takes about a minute. Run it on a laptop before a release.

## What the suites prove today

The P0 loop is green: a chase run starts, the outreach email lands in the loopback inbox, a reply on the inbound webhook drives the run to `done`, and the parsed fields reach `entities.result`.

Two gaps are asserted as the current truth, so a change in the product shows up as a test failure rather than a surprise:

1. The engine stamps the entity status only at the update step. A row in flight still reads `intake` on the board, and a finished row reads `updated` (the wire state `updating`) instead of `done`. The run carries the `done` status.
2. Because of that, a finished row lands in the board's "chasing" bucket, not in the "done" bucket.

When the engine starts writing `done` on the entity, the assertions in `src/api/p0-chase-loop.test.ts` and `ui/board-loop.spec.ts` should flip to the `done` bucket.

## Scenarios still to come

The scenarios for the other streams are added here as their code lands:

- P0.5: manual add-row and the brief fields (stream A)
- P1: the confirm, curate and approve gate, and the in-app inbox (streams B and C)
- P1.5: the search flow, with the repeat curate served from the catalog cache (stream F)
