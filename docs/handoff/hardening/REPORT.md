# Batch report: hardening (VPS batch B)

Branch `vps/hardening`, base `batch/hardening` + cherry-picked `9723ff2`.
All commits pushed to `origin/vps/hardening`. Head at report time: `ec6e55c`.

## Shipped

1. **`scripts/smoke.ts` always stops what it starts** (commit `ec6e55c`)
   - Children now spawn `detached: true` (each its own process-group leader); cleanup signals the whole group via `process.kill(-pid, sig)` (TERM, then KILL), and waits for exit (`waitForExit` with 5s/2s budgets).
   - SIGINT and SIGTERM both run the awaited cleanup before exiting; a synchronous best-effort group TERM remains on `process.on("exit")`.
   - `SMOKE_DEADLINE_MS` env seam injected so the failure path is drivable from tests.
   - New `scripts/smoke-leak-check.ts` self-check: runs smoke (a) with a 5s deadline that fails the chat-stream probe on a loaded host and (b) interrupted mid-flight with SIGINT, then scans `/proc` for surviving processes whose cwd is this worktree's `apps/web`. Failures kill survivors by exact PID.
   - Verified: 15 failing-path smoke runs and 8 sequential runs with **zero stray processes**; leak check passes 3/3.
   - Caveat, reported honestly: three strays were observed once during leak-check development (pids 3990883/3991097/3991613, state `R`, PPID 1, TERM-resistant, killed by exact PID). They were traced to a concurrent `pnpm exec vitest run` outside this repo (the full api suite runs 21 forks), not to smoke; after stopping it, 23 further smoke runs produced no strays. The timing depends on exact PIDs, so I cannot re-verify that attribution now; it is recorded, not proven.

2. **WhatsApp round-trip flake root-caused and fixed** (commits `b391665` cherry-pick, `5b66786`)
   - Cherry-picked `origin/work/w3-whatsapp-chatsdk` `9723ff2` (await the async probe in `waitFor`) onto the base first.
   - **Before** (post-cherry-pick, pre-fix): 15/18 in one loop, with 3 failures of the `turn.settled` assertion. Root causes, both in the harness (not feature code):
     a. `whatsapp-run.sh` slept a fixed 8s hoping the eve local-workflow queue transport was warm; the brief's ECONNREFUSED symptom comes from delivering into that window. Replaced with a poll on the eve health surface until it reports `"ready"`.
     b. `whatsapp-roundtrip.mjs` read `agent_events` for `turn.settled` once, synchronously, right after the reply landed at the mock; the row is written after the send, so ~1 in 6 runs raced it. Converted to the same `waitFor` probe pattern.
   - **After**: **20/20 passes** in a clean consecutive loop (`RUN` logs in `/tmp/wa-run2-*.log`, host-local, not committed).

3. **Flaky validate gate** (commit `bf5a399`)
   - First 5 gate runs: **5/5 passed** (durations 20s/23s/27s/28s/32s), so the brief's flake did not reproduce under normal load.
   - Digging further (`turbo run test --force` to bypass the turbo cache): the api suite flaked on vitest's 5s default under host load (6 cores, loadavg 17). Measured `import("../db")` (which compiles the bootstrap DDL at first open) at **3.9s warm / 5.5s+ loaded**. Isolated, the test passed 3/3; in the full suite it failed 4/7 runs (`contract-freeze.test.ts > bootstraps the new tables`, then `auth.test.ts > burns the previous code`).
   - Neither is a timing assumption under test, so both files got explicit `{ timeout: 30_000 }` budgets instead of weakened assertions. After: api suite 3/3 green, gate **5/5 green** (63s/24s/21s/24s/18s).

## Gate output (final run, after all commits)

```
validate: all steps passed [turbo(typecheck+lint+test)=23253ms, oxfmt=1029ms, manifests=936ms, knip=21272ms]
smoke: 7/7 checks passed [port 3900, eve 4310]
leak-check: PASS (3/3 iterations)
```

No processes left running (checked by exact scan for children with cwd in this worktree).

## Deviations

- The brief said "smoke against a deliberately failing check"; there is no smoke flag to inject a failing check, so the self-check injects a 5s deadline that reliably fails the chat-stream probe on this host, and treats a pass as a note rather than a failure (warm fast hosts can finish inside 5s).
- The brief said "fake timers or injected clock" for the flaky gate fix. The flake was not clock logic; it was a wall-time budget under load, so the deterministic fix was an explicit per-test timeout. No timing-dependent assertion was found that a fake clock would help.
- One extra commit (`b391665`) is the brief-mandated cherry-pick, not new work.

## What is left

- The intermittent TERM-resistant stray (item 1 caveat) deserves a look if it reappears; the leak self-check now detects it and prints exact PIDs.
- Turbo caches the api tests, so gate runs only exercise them on cache invalidation; `turbo run test --force` is the way to reproduce the load flake if needed.
