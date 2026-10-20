# @tarima/chase

Chase-deliverables state machine (SFM) on top of the durable engine.

## Rules

- NEVER import from channel packages (`@tarima/channels`) or `@tarima/llm`.
  LLM steps (parse, draft) depend on interfaces defined in this package;
  concrete providers are injected at wiring time.
- May import types only from `@tarima/engine` (contract-only: `./types`).
  Never import the engine runner implementation.
- State transitions are pure functions: same (state, event, context) in,
  same (state, effects) out. No I/O, no clock reads — pass `now` in.

## Testing

Vitest. Test transitions as tables; the crash-recovery path is covered by
the engine integration test that registers the chase template.
