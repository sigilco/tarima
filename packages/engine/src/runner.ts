import { completeStep, claimDueSteps, recoverExpiredLeases } from './journal'
import { nowMs } from './journal'
import type { EngineDb } from './db'
import type { HandlerRegistry, RunnerOptions } from './types'

export interface RunningHandle {
  stop: () => Promise<void>
}

/**
 * Lease-claim runner. Loop: recover expired leases (cheap upsert), claim due
 * steps with TTL leases, execute handlers, persist results. `startRunner`
 * returns immediately; `stop` drains in-flight steps.
 */
export function startRunner(
  db: EngineDb,
  handlers: HandlerRegistry,
  options: RunnerOptions = {},
): RunningHandle {
  const workerId = options.workerId ?? `worker-${process.pid}`
  const leaseTtlMs = options.leaseTtlMs ?? 60_000
  const pollIntervalMs = options.pollIntervalMs ?? 250
  const batchSize = options.batchSize ?? 10
  let stopped = false
  let inFlight = 0

  // Boot recovery: any step left `running` by a previous process has a
  // dead lease; requeue it immediately.
  recoverExpiredLeases(db)

  async function tick(): Promise<void> {
    const due = claimDueSteps(db, workerId, leaseTtlMs, batchSize)
    for (const step of due) {
      inFlight += 1
      void (async () => {
        try {
          const handler = handlers[step.stepKey]
          if (!handler) {
            completeStep(db, step.id, { ok: false, error: `no handler for step '${step.stepKey}'` })
            return
          }
          const result = await handler({
            runId: step.runId,
            workflowType: step.workflowType,
            state: step.state,
            input: step.input,
            context: step.context,
          })
          completeStep(db, step.id, { ok: true, result })
        } catch (err) {
          completeStep(db, step.id, {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          })
        } finally {
          inFlight -= 1
        }
      })()
    }
  }

  const timer: ReturnType<typeof setInterval> = setInterval(() => {
    if (!stopped) void tick()
  }, pollIntervalMs)
  timer.unref?.()

  return {
    stop: () =>
      new Promise((resolve) => {
        stopped = true
        clearInterval(timer)
        const check = setInterval(() => {
          if (inFlight === 0) {
            clearInterval(check)
            resolve()
          }
        }, 25)
        check.unref?.()
      }),
    _tick: tick,
    _workerId: workerId,
  } as RunningHandle & { _tick: () => Promise<void>; _workerId: string }
}

/** Run a single tick synchronously-ish; used by tests to avoid real timers. */
export async function runOnce(
  db: EngineDb,
  handlers: HandlerRegistry,
  options: RunnerOptions = {},
): Promise<number> {
  const workerId = options.workerId ?? `worker-${process.pid}`
  const leaseTtlMs = options.leaseTtlMs ?? 60_000
  const batchSize = options.batchSize ?? 10
  const due = claimDueSteps(db, workerId, leaseTtlMs, batchSize)
  for (const step of due) {
    try {
      const handler = handlers[step.stepKey]
      if (!handler) {
        completeStep(db, step.id, { ok: false, error: `no handler for step '${step.stepKey}'` })
        continue
      }
      const result = await handler({
        runId: step.runId,
        workflowType: step.workflowType,
        state: step.state,
        input: step.input,
        context: step.context,
      })
      completeStep(db, step.id, { ok: true, result })
    } catch (err) {
      completeStep(db, step.id, {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return due.length
}

export { nowMs }
