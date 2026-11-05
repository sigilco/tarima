# `.agents/screens/`

ASCII "screen" files are the canonical human-readable spec of every
customer-facing route in `apps/web`. `screen-INDEX.txt` is the directory;
each `screen-<area>-<n>.txt` describes one route's layout, copy, states, and
interaction contract. Convention mirrors brioso's `.agents/screens/`.

Older prose specs live in `.agents/docs/screens/` (board, login, row-modal,
settings) — new work uses this directory; migrate a spec here when you touch
that route.

## Why

Screens are the contract between design sessions (SP2-B, SP4, SP5, SP7) and
implementation. A screen file is written *before* the route is re-themed or
rebuilt, and the implementation is done when the rendered route matches the
ASCII box and every listed state is reachable. Verify states in the
component isolation harness (`pnpm -C apps/web cosmos`) before wiring them
into the route.

## File format

One file per route (or per distinct visual state of a route when states
diverge enough to need their own box, e.g. `screen-auth-1.txt` /
`screen-auth-2.txt`). Plain text, UTF-8 box-drawing chars, ~60 cols wide.

Header block (required):

```
screen: <area>-<n>
name: <human name>
route: </path>            # include ?query=keys the route reads
file: apps/web/src/routes/<file>.tsx
theme: light | dark | both
components: <shadcn/ui components used, e.g. card, input, button, sonner>
```

Prose block (required): 1–2 short paragraphs. What the screen is for, how
the user arrives, what state machine drives it (local state vs router vs
server), and anything non-obvious about data flow.

Then one ASCII box per state, each preceded by a label line:

```
State: <name> — <when it occurs / how to reach it>

┌──────────────────────────────────────────────────────────┐
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
```

Footer blocks (as needed):

- `States:` exhaustive list — default, hover, focus, active, disabled,
  loading, empty, error, success. Every interactive element in the box must
  have its states enumerated here or in the prose.
- `Transitions:` how states move (e.g. "Send code → 200 → step=code, no
  router navigation"; "sheet opens from right, 200ms ease-out").
- `Animations:` anything that moves — what, duration, easing, trigger.
  Prefer tailwind `transition-*` utilities already on the shadcn components.
- `Copy:` user-facing strings, one per line, keyed (`copy.sendCode: Send
  code`). Paraglide message keys once they exist.
- `Tokens:` any theme token the screen depends on beyond the defaults
  (e.g. "accent clay `--color-clay` on the primary button only").

## Rules

- Everything rendered must be shadcn/ui (`apps/web/src/components/ui`) or
  composed from it. No hand-rolled buttons/inputs/cards in routes.
- Accents (clay `#b8491f`, amber `#FDE047`) are accents only — never
  surfaces. Surfaces stay off-white `#FAFAFA` / card white.
- Keep the INDEX in sync: add a row per screen file, update `generated:`.
- Landing (`/`) is out of scope until SP7; do not write screens for it yet.

## Template

Copy this into `screen-<area>-<n>.txt`:

```
screen: <area>-<n>
name: <name>
route: </path>
file: apps/web/src/routes/<file>.tsx
theme: light
components: <list>

<prose: purpose, entry points, state machine>

State: default

┌──────────────────────────────────────────────────────────┐
│                                                          │
└──────────────────────────────────────────────────────────┘

States: default | hover | focus | disabled | loading | error
Transitions: <state → state, trigger, duration>
Animations: <what moves, duration, easing>
Copy:
  copy.<key>: <string>
Tokens: <non-default tokens used>
```

## Planned screens (owners)

- `screen-auth-1.txt` — login email step (SP2-B)
- `screen-auth-2.txt` — login code step (SP2-B)
- `screen-chat-1.txt` — chat panel (SP4)
- `screen-shell-1.txt` — workspace shell (SP5)
