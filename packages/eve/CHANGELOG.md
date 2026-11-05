# eve 1.0.0-rc.5

Released 2026-11-05 · [Compare with 1.0.0-rc.4](https://github.com/vercel/eve/compare/eve%401.0.0-rc.4...eve%401.0.0-rc.5)

## Features

- Deployed agents start faster and use less memory, because hosted builds now include each installed package once instead of once per instrumentation file and once more for the agent's modules.
  Before, when instrumentation files imported the same packages as the agent, every one of those packages shipped, loaded, and ran more than once on each cold start. In one production agent with five instrumentation files, the workflow route's bundle dropped from 34 MB to 22 MB and its cold start from about 2.6 s to about 1.8 s. ([#5943](https://github.com/vercel/eve/pull/5943))
- Update the bundled Workflow runtime to 5.4.0.
  Workflow 5.4.0 resumes a parent run once when a child run finishes instead of polling in a step, honors abort signals when waiting for a run to finish on the Vercel World, and recovers Hook token claims left by a crashed process right away on the local World instead of after 30 seconds. ([#5944](https://github.com/vercel/eve/pull/5944))

## Bug Fixes

- Fix local-world sessions that stalled after `eve start` or `eve dev --resume` restarted mid-turn: a turn waiting on a timer, such as `sleep`, now wakes on time, and a step that was running when the previous process stopped runs again right away instead of after about 14 minutes.
  The timer fix applies to spec 9 runs, which eve now creates by default. The step fix applies to spec 8 runs, including every session created before eve moved to spec 9. For those runs, the interrupted attempt counts toward the step's retries, so a workflow tool step with `maxRetries: 0` that was running when the process stopped fails on restart instead of running again. Run one process per `.eve/.workflow-data` directory: recovery treats steps started before it booted as abandoned. ([#5873](https://github.com/vercel/eve/pull/5873))
- Fix workflow hook ownership checks and preserve workflow error types and retry timing.
  `hook.getConflict()` now returns the existing owner's run ID inside workflow bodies. `FatalError` and `RetryableError` caught from steps retain their class identity, and workflow-created `RetryableError` values honor `retryAfter`. ([#5937](https://github.com/vercel/eve/pull/5937))

For an upgrade across multiple releases, review each version between the installed and target versions in the [target version's changelog](https://raw.githubusercontent.com/vercel/eve/refs/tags/eve%401.0.0-rc.5/packages/eve/CHANGELOG.md).
