# SP3 — Working turn proof (2026-11-05 12:15 UTC)

The agent now answers over HTTP, authenticated, grounded in our SQLite data,
and its tool calls are visible. This is the proof the project was missing.

## Commits (branch `work/sp3-agent`, pushed)

| sha | what |
|---|---|
| `c5b3c33` | point the workflow local world at the eve runtime origin |
| `6661b43` | keep the eve runtime out of the build; make the mount awaitable |
| `98d6636` | capture the tool calls the agent actually made |
| `8a992ee` | vendor the eve runtime dist; make knip resolve its export map |
| `d01d1cb` | keep the vendored eve dist out of knip source resolution |

## The three bugs, in the order they bit

**1. The workflow queue delivered to the wrong origin.**
`@workflow/world-local` resolves its delivery base URL from `WORKFLOW_LOCAL_BASE_URL`,
then `process.env.PORT`. `PORT` belonged to the *web app*, which serves no
`/.well-known/workflow/*` route, so every turn 404'd and retried 26+ times until
the delivery was exhausted:

```
[world-local] Queue message failed (attempt 34, HTTP 404) {
  queueName: '__eve776562_wkf_workflow_workflow//eve//workflowEntry',
  hint: `No route or handler is registered for queue prefix "__eve776562_wkf_workflow_",
    so its messages go to the Workflow SDK's flow route (/.well-known/workflow/v1/flow).`
}
```

Fix: set `WORKFLOW_LOCAL_BASE_URL` to the eve runtime's loopback origin, before
the runtime module is imported (`apps/web/agent/runtime.ts`).

**2. The build booted the agent.**
`mountEveRuntime()` ran at module scope, and the nitro build imports the server
entry to prerender pages. So the build process started the eve runtime: its
listener never exited (builds took 20-35 min) and it loaded the model provider
with no API key, logging a false

```
[eve:harness.tool-loop] Model provider API key missing: The model provider could not load an API key.
```

That error was a build artifact, not a turn failure — it cost SP3-B and SP3-C
their boxes chasing it. Fix: skip the mount when the process is a build, and
keep the mount promise so a turn arriving before the runtime binds waits for it
instead of getting a 503.

**3. The tool calls were invisible.**
eve publishes calls as `call.requested` / `call.settled` facts. The handler
looked for `tool.call` / `tool.result`, so `toolCalls` was always `[]`.
Fix: read the real fact types and carry the capability name, input and output.

## Build time

```
before: 20-35 minutes (the eve runtime booted inside the build and never exited)
after:  16 seconds
$ pnpm --filter web build
real 0m16.229s
[eve-runtime] build process detected; skipping the agent mount
```

## The working turn

Recipe (throwaway DB, real gateway, real cookie):

```bash
cd ~/.worktrees/sp3/eve/apps/web
source /tmp/sp3-agents.env && export BIFROST_VK
export BIFROST_BASE_URL=http://127.0.0.1:8317/v1
export DATABASE_URL=/tmp/tarima-probe3.db NODE_ENV=development DEV_LOGIN=1 \
       SESSION_SECRET=probe-secret PORT=3302 TARIMA_EVE_PORT=4322
node dist/server/server/index.mjs &
```

Seed: dev-login `qa@tarima.test` -> cookie; project "Berkeley decision-models
evening" with goal `{city: Berkeley CA, timeWindow: 17:30-20:30, attendees: 10-25}`;
entity "Find venue sponsor"; 2 `venue_catalog` rows (The Faculty Club, Cafe Strada).

**401 without the cookie:**
```
$ curl -s -o /tmp/nc.json -w "%{http_code}" -H "content-type: application/json" \
    -d '{"message":"ping"}' http://127.0.0.1:3302/api/agent/turn
401
{"error":"authentication_required","message":"Sign in to use the agent."}
```

**The turn** (the owner's canonical Berkeley case):
```
status: completed | outcome: handled
```

Tool calls the agent actually made:
```
requested | get_project_context | {}
settled   |                    | output: { project: { id, name: "Berkeley decision-models evening",
                                           goal: { city: "Berkeley, CA", timeWindow: "17:30-20:30",
                                                   attendees: "10-25" }, stage: "brief" },
                                     entities: [ { id, name: "Find venue sponsor", status: "intake" } ] }
requested | list_venues       | {"city": "Berkeley"}
requested | list_sponsors     | {"kind": "restaurant", "projectId": "0f428edd-..."}
requested | list_sponsors     | {"kind": "ai credits", "projectId": "0f428edd-..."}
settled   | (x3)              | outputs
```

The reply (excerpt):
> Here's what I found for your project **"Berkeley decision-models evening"** (Berkeley, 5:30-8:30 PM, 10-25 attendees, wifi + grouped seating + TV/projector required):
>
> **Venue catalog for Berkeley (2 venues, both fit your headcount):**
> 1. **The Faculty Club** — UC Berkeley campus, capacity 60, mid price band, events@berkeleyfacultyclub.com
> 2. **Cafe Strada** — Bancroft Way, capacity 30, low price band, +1 510-549-5300
>
> **Sponsors:** The sponsor catalog currently has no restaurant/bar/cafe sponsors and no AI-credits sponsors for Berkeley — Tarima doesn't invent contacts, so there's nothing verified to list yet.
>
> **Suggested next actions:** Contact Cafe Strada first (single venue+food sponsor, low price band) and ask: evening buyout 5:30-8:30 PM, wifi, TV/projector, group seating... Contact the Faculty Club as the backup/AV-safe option.

Every fact in the answer (capacities, price bands, the phone number, the task
status) comes from the seeded rows. The agent called our tools and reasoned over
our data.

## Known gaps (next boxes)

- **The browser cannot reach the eve runtime.** It listens on `127.0.0.1:4322`
  inside the server process. SP4 is shipping a `/api/eve` proxy route for this.
- **`POST /api/agent/turn` does not stream.** It returns the settled reply. The
  proxy path (option A) is the one that can stream.
- **Approvals are not wired yet** (SP3-D): the `approval: always()` policy, the
  approvals mirror and the audit mirror are still TODO.
