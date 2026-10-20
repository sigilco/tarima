# @tarima/engine

Durable step journal and lease-based runner for Tarima workflows.

## Rules

- NEVER import from `@tarima/chase` or any domain package. The engine is
  domain-agnostic: it stores step keys and JSON payloads only.
- Domain packages register handlers with the runner; the engine calls them
  through the `StepHandler` interface from `./types`.
- Workflow/step state transitions must be persisted in the same SQLite
  transaction that records step output. Never advance state before output
  is durable.
- Side effects go through the outbox with an idempotency key. Executors
  must check outbox status before sending.

## Testing

Vitest, shared catalog versions. Crash-recovery tests simulate process
death by abandoning leases (expired lease timestamps), never by timing.
