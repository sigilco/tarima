# Tarima landing — evaluation rubric

Evaluator contract: score the rendered page (desktop 1440px + mobile 390px) against
each criterion 0–10, cite screenshot evidence per score, list concrete fixes ranked
by impact. Ship bar: every criterion ≥7 AND total ≥80/100. A criterion below 7 is a
mandatory fix list for the next generator iteration.

## C1 · 3-second test (hero)
A first-time visitor instantly reads: "an agent does the ops busywork of my event —
I approve what it does." The hero carries the animated board, not a stock
illustration. CTA is a single email field + "Request access" (gated access; no
"book a demo", no pricing CTA in hero).

## C2 · Typography
Instrument Serif display for headlines with an italic accent word; Geist for UI.
Real hierarchy: display ~64–72px, section heads ~40–54px, body 15–17px. No
Inter/Roboto/Arial/Open Sans/Helvetica anywhere (computed style check counts).

## C3 · Color & material
Warm paper background, ink text, ONE clay/terracotta accent (sage/amber only for
status pills). No flat gray 1px borders on cards — use double-bezel rings and
tinted washes. Subtle grain/texture present. No harsh drop shadows.

## C4 · Hero board animation (the differentiator)
Within 10s of watching, the evaluator can name what the agent did: cursor visibly
travels to a row/cell, a cell edge lights while the agent "works" it, status pills
change (Calling → Replied → Quoted → Awaiting approval), and an approval card
appears. Animation loops cleanly, transform/opacity only, no jank.

## C5 · Section completeness & flow
Order: hero → two jobs toggle (venues / sponsors boards) → how it works (4 steps)
→ why/differentiation (3 honest cards) → proof transcript → pricing teaser → FAQ
→ footer. Smooth-scroll anchor links in the nav work.

## C6 · Copy discipline (source of truth = refinement doc)
Agent-first framing; HITL approval is explicit; no loose "AI" claims, no "agent-
callable API" claim, no fake customer logos, no invented metrics. All strings come
from paraglide messages (en.json) — no hardcoded copy in components.

## C7 · Craft details
Buttons have hover+active states with spring easing; reveal-on-scroll present but
subtle; focus states exist; nav is a floating pill (not an edge-to-edge bar);
cursor micro-interaction feels deliberate, not gimmicky.

## C8 · Mobile integrity
390px: hero stacks, board is legible (min 11px text or horizontal-safe layout),
nav collapses gracefully, no horizontal overflow, tap targets ≥40px.

## C9 · Technical health
Zero console errors, zero 5xx, request-access POST returns 201 and shows the done
state, page renders without SSR hydration errors, `pnpm tsc --noEmit` clean in
apps/web.

## C10 · Overall "expensive" feel
Would this sit beside Attio/Clay/Luma without embarrassment? Gut check — list the
top 3 things that make it feel cheap and the top 3 that make it feel premium.
