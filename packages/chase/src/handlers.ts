import type { StepContext, StepResult } from '@tarima/engine/types'
import type { ChaseContext, ChaseEvent, ChaseState } from './sfm'
import { transition } from './sfm'
import type { ChaseLlm } from './llm'

/**
 * Event-based step handlers. Each engine step key 'chase.<state>' receives
 * the triggering event in ctx.input.event, runs the pure transition, and
 * returns the effects as outbox emits + the next state. The *next* state's
 * step is enqueued so the engine journals every hop.
 */
export function chaseHandlers(llm: ChaseLlm) {
  return {
    'chase.intake': async (ctx: StepContext): Promise<StepResult> => {
      return apply(ctx, 'INTAKE_OK', llm)
    },
    'chase.outreach': async (ctx: StepContext): Promise<StepResult> => {
      // Draft via the LLM seam, emit the send side effect with idempotency.
      const goal = (ctx.input.goal ?? {}) as Record<string, unknown>
      const entityName = String(ctx.input.entityName ?? ctx.context.entityName ?? 'there')
      const isFollowUp = Boolean(ctx.input.followUp)
      const draft = await llm.draftOutreach({
        entityName,
        goal,
        isFollowUp,
        followUpNumber: isFollowUp ? ((ctx.context.followUps as number | undefined) ?? 0) : undefined,
      })
      return apply(ctx, 'DRAFT_SENT', llm, {
        output: { draft },
        emit: [
          {
            idempotencyKey: `chase:send:${ctx.runId}:${isFollowUp ? `followup-${ctx.context.followUps ?? 0}` : 'initial'}`,
            type: 'email.send',
            payload: { ...draft, to: ctx.input.to ?? ctx.context.contactEmail },
          },
        ],
      })
    },
    'chase.await_reply': async (ctx: StepContext): Promise<StepResult> => {
      const event = (ctx.input.event as ChaseEvent | undefined) ?? 'REPLY_RECEIVED'
      // Distinguish a fresh await_reply (entering the wait) from a re-entry
      // after a follow-up (already carrying FOLLOWUP_DUE). The wait itself is
      // instant here: the engine's run_at governs when the reply/follow-up
      // step actually fires.
      if (event === 'REPLY_RECEIVED' && ctx.input.isAwaitEntry) {
        return { output: { enteredAwait: true }, nextState: 'await_reply' }
      }
      return apply(ctx, event, llm)
    },
    'chase.followup': async (ctx: StepContext): Promise<StepResult> => {
      const entityName = String(ctx.input.entityName ?? ctx.context.entityName ?? 'there')
      const draft = await llm.draftOutreach({
        entityName,
        goal: (ctx.input.goal ?? {}) as Record<string, unknown>,
        isFollowUp: true,
      })
      return apply(ctx, 'FOLLOWUP_SENT', llm, {
        output: { draft },
        emit: [
          {
            idempotencyKey: `chase:send:${ctx.runId}:followup-${ctx.context.followUps ?? 1}`,
            type: 'email.send',
            payload: { ...draft, to: ctx.input.to ?? ctx.context.contactEmail },
          },
        ],
      })
    },
    'chase.parse': async (ctx: StepContext): Promise<StepResult> => {
      // Default event when no reply body was provided (happy-path demo):
      // treat as a positive reply so the chain continues.
      const body = String(ctx.input.body ?? 'done, everything is attached')
      const goal = (ctx.input.goal ?? ctx.context.goal ?? {}) as Record<string, unknown>
      const parsed = await llm.parseReply(body, goal)
      return apply(ctx, parsed.answered ? 'REPLY_PARSED' : 'REPLY_INVALID', llm, {
        output: { parsed },
      })
    },
    'chase.validate': async (ctx: StepContext): Promise<StepResult> => {
      // Parsed payload was persisted by the parse step's output; carry it
      // forward on the enqueued step input so validation sees it.
      const parsed = (ctx.input.parsed ?? {}) as { confidence?: number; answered?: boolean }
      const ok = parsed.answered === true || (parsed.confidence ?? 0) >= 0.5
      return apply(ctx, ok ? 'VALIDATED' : 'REPLY_INVALID', llm)
    },
    'chase.update': async (ctx: StepContext): Promise<StepResult> => {
      const parsed = (ctx.input.parsed ?? {}) as { fields?: Record<string, unknown> }
      return apply(ctx, 'ENTITY_UPDATED', llm, {
        output: { updatedFields: parsed.fields ?? {} },
        emit: [
          {
            idempotencyKey: `chase:update:${ctx.runId}`,
            type: 'entity.update',
            payload: { fields: parsed.fields ?? {} },
          },
        ],
      })
    },
    'chase.notify': async (ctx: StepContext): Promise<StepResult> => {
      return apply(ctx, 'NOTIFIED', llm, {
        emit: [
          {
            idempotencyKey: `chase:notify:${ctx.runId}`,
            type: 'notify',
            payload: { runId: ctx.runId },
          },
        ],
      })
    },
  }
}

/** Run the pure transition and shape the engine StepResult from its effects. */
function apply(
  ctx: StepContext,
  event: ChaseEvent,
  _llm: ChaseLlm,
  extra: Partial<StepResult> = {},
): StepResult {
  const state = (ctx.state || 'intake') as ChaseState
  const chaseCtx: ChaseContext = {
    now: Date.now(),
    ...(ctx.context as Partial<ChaseContext>),
  }
  const t = transition(state, event, chaseCtx)
  if (!t) {
    return { output: { error: `invalid transition ${state}+${event}` }, nextState: 'failed' }
  }
  const effectEmits = t.effects.map((effect) => ({
    idempotencyKey: `chase:effect:${ctx.runId}:${state}:${effect.kind}`,
    type: `chase.${effect.kind}`,
    payload: effect as unknown as Record<string, unknown>,
  }))
  return {
    output: { from: state, event, to: t.next, effects: t.effects },
    nextState: t.next,
    nextSteps:
      t.next !== 'done' && t.next !== 'failed'
        ? [
            {
              key: `chase.${t.next}`,
              // Carry accumulated payload (draft, parsed) to the next step.
              // The triggering event belongs to the current step only;
              // the next state derives its own event from its input.
              input: { ...ctx.input, event: undefined, ...(extra.output ?? {}) },
              delayMs: t.delayMs,
            },
          ]
        : [],
    emit: effectEmits,
    contextPatch: t.contextPatch as Record<string, unknown> | undefined,
    finish: t.next === 'done' || t.next === 'failed',
    ...extra,
  }
}
