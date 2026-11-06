# Batch 6: hardening — report

Branch `batch/hardening`. Three deliverables, all shipped.

## 1. `scripts/smoke.ts` always stops what it starts

- Children (channel mocks + web server) now spawn `detached: true`, so
  each leads its own process group; cleanup signals the **group**
  (`kill(-pid)`), not just the direct child — the web server spawns
  workers of its own, which is how five orphan node processes leaked.
- `killAll()` is async and awaited on every exit path: success
  (`finally`), failure (same `finally`), SIGINT (exit 130) and SIGTERM
  (exit 143, newly handled — previously only SIGINT was caught).
  Sequence: SIGTERM to all groups, wait up to 8s for `exit` events,
  SIGKILL survivors, wait up to 3s more. A synchronous `exit` handler
  re-sends SIGKILL as a last resort for uncaught throws.
- Child stdio pipes are drained (`resume()`): nobody reads them, and a
  full 64KB pipe buffer would have blocked a child on write.
- New self-check `scripts/smoke-leak-check.ts` (`.ts`, not `.mjs`, so
  knip's `scripts/*.ts` entry covers it):
  - **failure path** — `SMOKE_FORCE_FAIL=1` throws a deliberate check
    failure after the children are healthy; smoke exits 1 and the check
    asserts every reported child pid **and** process group is gone.
  - **SIGTERM path** — smoke is signalled mid-run once both children
    are up; same assertion.
  - `SMOKE_REPORT_CHILDREN=1` makes smoke print `child <name> pid=<pid>`
    on stderr so the check can track them; `SMOKE_DEADLINE_MS` shortens
    the readiness deadline for fast failure runs.
- Result: `node scripts/smoke-leak-check.ts` → 6/6 checks PASS, and
  `pgrep` confirms no processes remain from this worktree.

## 2. WhatsApp round-trip flake — root-caused and fixed

Cherry-picked `9723ff2` first (it was not in the base; the earlier W3
harness commits already were).

**Portability blocker found:** `9723ff2`'s `setsid` is Linux-only —
on macOS the harness died at `setsid: command not found` before the
server ever booted. Replaced with a portable detached spawn through
`node -e` + `child_process.spawn({detached:true})` (pgid == pid) and
group-kill (`kill -TERM -$pid`, then `-KILL`) in `cleanup()`.

**Before fix: 14/20 pass** (6 failures, runs 3–7 and 9 of the loop).
Every failure was `[wa-e2e] FAIL: no turn.settled agent_events for
principal u-wa-e2e` — and in **all six** cases the `turn.settled` row
existed in `wa.db` moments later. Root cause: the harness read
`agent_events` exactly once, immediately after the outbound reply
reached the mock; the runtime commits `turn.settled` a few ms after the
reply is sent, so ~30% of runs asserted on a not-yet-visible row.

**Fixes in `apps/web/tests/turn/whatsapp-roundtrip.mjs` and
`whatsapp-run.sh`:**

- Poll the DB for `turn.settled` via the existing `waitFor` (60 × 500ms)
  instead of a single snapshot. This is the actual flake fix.
- Replaced the blind `sleep 8` queue warm-up with a **readiness probe**
  on `/.well-known/workflow/v1/flow` — the local workflow world's own
  queue delivery route on the eve origin. Any HTTP status (it answers
  401 without the delivery secret) proves the socket and route are
  live; the loop waits up to 60s and prints the observed code. Every
  post-fix run logged `workflow queue route ready (HTTP 401)`.
- `WORKFLOW_LOCAL_BASE_URL` export now points at the eve port
  (`$eve_port`) instead of the web port — `agent/runtime.ts` re-pins it
  to `TARIMA_EVE_PORT` at mount anyway, but the export was wrong and
  misleading (the web origin 404s the flow route).

**After fix: 20/20 pass.** The ECONNREFUSED-on-first-delivery symptom
did not reproduce in 20 before-runs on this host (queue transport
retries every 5s and self-heals), but the readiness wait removes the
window it describes rather than lengthening a sleep.

## 3. Flaky `validate` gate

Ran `mise run validate` 5 times, plus 3 more via pre-commit/pre-push
hooks — **7 consecutive green runs, no flake reproduced**:

| run | wall time |
|-----|-----------|
| 1   | 16.4s     |
| 2   | 24.7s     |
| 3   | 22.2s     |
| 4   | 18.5s     |
| 5   | 12.5s     |

All ended `validate: all steps passed`. The only timing-sensitive
tests in the suite (`chat-state-sqlite.test.ts` TTL/lock expiry with
15ms sleeps vs 5ms expiries) have wide margins and did not flake; no
test changes were needed. The single observed pre-push failure was
likely environmental (this batch ran on a shared machine alongside
other worktrees' servers); nothing deterministic to fix.

## Gates

- `mise run validate` — green (5/5 explicit runs + hook runs).
- `mise run verify:smoke` — `smoke: 7/7 checks passed`.
- Round-trip harness — 20/20 after the fix (14/20 before).
- `node scripts/smoke-leak-check.ts` — PASS, no leftover processes.

## Deviations

- `whatsapp-run.sh` needed a portability fix (`setsid` → node detached
  spawn) for the cherry-picked commit to run on macOS; same intent
  (own process group, group kill on cleanup).
- The leak-check script is `.ts` (knip entry glob is `scripts/*.ts`);
  it is a manual self-check, not wired into `validate` — wiring it
  would add ~1min of server boots to every gate.
- No feature code touched; only `scripts/smoke*.ts`,
  `apps/web/tests/turn/whatsapp-*`.
