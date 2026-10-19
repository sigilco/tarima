import asyncio
import json

REPO = "github.com/sigilco/tarima"
BRANCH = "devin/tarima-landing"
MAX_ROUNDS = 3
PASS_TOTAL = 80
PASS_MIN = 7

BRIEF = """\
Product (source of truth — docs/12_landing_and_frontend.md and the refinement doc
it summarizes, NOT older repo docs): Tarima is the multiplayer back-office ops
agent for events. One 'cell-filler' engine, two jobs: (1) venue/vendor sourcing —
the agent emails/calls venues, parses quotes, fills a comparison board;
(2) sponsor/speaker chasing — it chases logos, invoices, slides across email/chat.
HITL: the agent collects and proposes but never commits without human approval.
Landing goal: gated request-access waitlist (email field + 'Request access', NO
'book a demo'), English-only copy via paraglide (packages/copy/messages/en.json),
no real data — mocked board rows are expected and fine.
Stack: bun workspaces; apps/web = TanStack Start + Tailwind v4 + paraglide;
apps/api = Hono + drizzle + better-sqlite3 (POST /api/access-requests, vite
proxies /api -> :3001). Design system: warm paper bg, ink text, single clay
accent, Instrument Serif display + Geist, double-bezel cards, floating pill nav,
grain texture, reveal-on-scroll, spring cubic-bezier motion. The hero board
(AgentBoard.tsx) must visibly show the agent acting: cursor travel, cell
edge-lighting, status pills cycling, approval card appearing.
"""

RUNBOOK = f"""\
Repo {REPO}, branch {BRANCH} (checkout it, work on it, push to it).
Setup: `bun install` at repo root. Dev servers:
  cd apps/api && bun run dev          # :3001
  cd apps/web && bun run dev          # :3000, /api proxied
If src/paraglide is missing, the vite plugin regenerates it on dev start;
`bunx tsc --noEmit` in apps/web must be clean.
Screenshots: open http://localhost:3000 in your browser (Chrome is running),
screenshot at desktop and at mobile widths if possible.
GIT IDENTITY IS MANDATORY — commit only with:
  GIT_AUTHOR_NAME=espetro GIT_AUTHOR_EMAIL=josocjoq+dev@pm.me \
  GIT_COMMITTER_NAME=espetro GIT_COMMITTER_EMAIL=josocjoq+dev@pm.me \
  /usr/bin/git commit -m "..."
Never let devin-bot or any bot identity appear in commits. No AI trailers.
"""

GEN_SCHEMA = {
    "type": "object",
    "properties": {
        "branch": {"type": "string"},
        "summary": {"type": "string"},
        "self_check": {"type": "string"},
    },
    "required": ["branch", "summary", "self_check"],
}

EVAL_SCHEMA = {
    "type": "object",
    "properties": {
        "scores": {"type": "object"},
        "total": {"type": "number"},
        "passed": {"type": "boolean"},
        "must_fix": {"type": "array", "items": {"type": "string"}},
        "notes": {"type": "string"},
    },
    "required": ["scores", "total", "passed", "must_fix", "notes"],
}


async def main():
    await register_workflow({
        "name": "tarima-landing-gen-eval",
        "description": "Generator/evaluator loop for the Tarima landing page",
        "soft_time_limit_minutes": 35,
        "phases": [
            {"title": "generate", "detail": "Build/polish the landing page",
             "count": MAX_ROUNDS},
            {"title": "evaluate", "detail": "Rubric-scored screenshot review",
             "count": MAX_ROUNDS},
        ],
    })

    feedback = (
        "This is round 1: the scaffold and components exist but the page has not "
        "been verified end-to-end. Boot the app, fix every compile/runtime/"
        "rendering bug, verify the request-access POST works (api + proxy), then "
        "do a full visual polish pass. "
    )

    for round_index in range(MAX_ROUNDS):
        gen = await agent(
            phase="generate",
            label=f"gen-r{round_index + 1}",
            prompt=(
                f"{RUNBOOK}\n{BRIEF}\n"
                "You MUST invoke the skill named 'high-end-visual-design' first "
                "and follow it exactly. Round "
                f"{round_index + 1} of at most {MAX_ROUNDS}.\n{feedback}\n"
                "After edits: verify with real screenshots of the running page "
                "(desktop viewport) — hero, jobs toggle, all sections, footer — "
                "fix what looks cheap, then commit and push to the branch. "
                "Report branch, a 3-line summary, and what you verified "
                "visually in self_check."
            ),
            schema=GEN_SCHEMA,
        )
        log(f"gen r{round_index + 1} done: {gen['summary']}")

        ev = await agent(
            phase="evaluate",
            label=f"eval-r{round_index + 1}",
            prompt=(
                f"{RUNBOOK}\n{BRIEF}\n"
                "You are the evaluator — do NOT modify any file. Pull the latest "
                f"{BRANCH}, run the app, and score the rendered landing page "
                "against the rubric at docs/13_landing_rubric.md (read it in "
                "full). Take real screenshots: desktop 1440px of every section "
                "and mobile 390px of hero + one more section. Watch the hero "
                "board for ~15s to judge C4. Submit the access form with a test "
                "email and confirm the done state (for C9). Score each of "
                "C1–C10 from 0-10 with evidence; pass only if every score >= 7 "
                f"AND total >= {PASS_TOTAL}. In must_fix list concrete fixes "
                "ranked by impact (max 8). In scores return an object "
                '{"c1": int, ..., "c10": int}.'
            ),
            schema=EVAL_SCHEMA,
        )
        log(f"eval r{round_index + 1}: total={ev['total']} passed={ev['passed']}")

        if ev["passed"]:
            return {"status": "passed", "rounds": round_index + 1,
                    "final_eval": ev}
        feedback = (
            f"Evaluator findings from round {round_index + 1} (fix ALL of them, "
            "then keep polishing): " + "; ".join(ev["must_fix"]) +
            f". Scores: {json.dumps(ev['scores'], sort_keys=True)}. "
        )

    return {"status": "max_rounds_reached", "rounds": MAX_ROUNDS,
            "final_eval": ev}


asyncio.run(main())
