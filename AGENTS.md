# tarima

Multi-channel, self-hosted (VPS + SQLite) agent app with an owned audit and
approval record. pnpm + turbo via mise.

## Definition of done

Before reporting any work as done:

- In the loop, run `mise run validate:quick` (~10s cold, ~1s warm via turbo).
- Before reporting, run `mise run validate` (full gate: typecheck, lint,
  format, tests, knip), plus `mise run verify:smoke` when the work touches
  the runtime, agent, or UI. Paste the summary lines into your report.
- Never commit with `--no-verify`. If a hook fails, fix the problem.
- Never run two heavy gates (typecheck/test/build) at once.
- `mise run test:whatsapp-roundtrip` is an opt-in check (slow: builds web
  + eve, boots a throwaway stack). Run it when the work touches the
  WhatsApp channel, the eve runtime, or webhook ingress; skip it otherwise.

## Commands

- `mise run setup` — install deps, seed `.env.local` from `.env.example`,
  install git hooks.
- `mise run dev` — vite dev server + channel mocks; the eve runtime mounts
  in-process on demand; stub LLM when no key is available. Prints the
  dev-login URL (app on :3000).
- `mise run preview` — build web + eve, then serve the built app with the
  mocks (`node dist/server/server/index.mjs`).
- `mise run verify:smoke` — boot the preview build on a temp DB and assert
  the wire paths (assets 200, dev-login, session, streaming turn, mock
  round-trips).
- `mise run test:whatsapp-roundtrip` — opt-in WhatsApp channel proof: stub
  LLM, mock Graph API, throwaway DB; builds web + eve first if missing.
  Run it when touching the WhatsApp channel, eve runtime, or webhook path.
