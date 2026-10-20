import type { EngineDb } from './db'

export type StepStatus = 'pending' | 'running' | 'done' | 'failed'
export type WorkflowStatus = 'running' | 'done' | 'failed'

/** Input a handler receives. `ctx.state` is the workflow's persisted state. */
export interface StepContext {
  runId: string
  workflowType: string
  state: string
  input: Record<string, unknown>
  context: Record<string, unknown>
}

/**
 * What a handler returns. `output` is persisted before any state advance;
 * `nextState` moves the workflow's SFM state; `nextSteps` enqueues child
 * steps; `emit` queues outbox side effects (each needs an idempotency key).
 */
export interface StepResult {
  output?: Record<string, unknown>
  nextState?: string
  nextSteps?: Array<{
    key: string
    input?: Record<string, unknown>
    /** Delay in ms before the step is due. */
    delayMs?: number
  }>
  emit?: Array<{
    idempotencyKey: string
    type: string
    payload?: Record<string, unknown>
  }>
  /** Merge these keys into the workflow's persisted context. */
  contextPatch?: Record<string, unknown>
  /** Mark the whole run done (terminal states). */
  finish?: boolean
}

export type StepHandler = (ctx: StepContext) => Promise<StepResult> | StepResult

export type HandlerRegistry = Record<string, StepHandler>

export interface RunnerOptions {
  /** Worker identity stamped on leases. */
  workerId?: string
  /** Lease TTL in ms (default 60_000). */
  leaseTtlMs?: number
  /** Poll interval in ms (default 250). */
  pollIntervalMs?: number
  /** Max steps claimed per tick (default 10). */
  batchSize?: number
}

export interface ClaimedStep {
  id: string
  runId: string
  stepKey: string
  input: Record<string, unknown>
  workflowType: string
  state: string
  context: Record<string, unknown>
}
