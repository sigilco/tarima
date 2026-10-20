/**
 * Chase-deliverables state machine (SFM).
 *
 * States: intake -> outreach -> await_reply -> parse -> validate -> update
 * -> notify. await_reply can branch to followup (with backoff) before
 * returning to parse. All transitions are pure: (state, event, ctx) ->
 * { next, effects }. No I/O, no clock reads (ctx.now passed in).
 */

export type ChaseState =
  | 'intake'
  | 'outreach'
  | 'await_reply'
  | 'followup'
  | 'parse'
  | 'validate'
  | 'update'
  | 'notify'
  | 'done'
  | 'failed'

export type ChaseEvent =
  | 'INTAKE_OK'
  | 'DRAFT_SENT'
  | 'REPLY_RECEIVED'
  | 'FOLLOWUP_DUE'
  | 'FOLLOWUP_SENT'
  | 'REPLY_PARSED'
  | 'REPLY_INVALID'
  | 'VALIDATED'
  | 'ENTITY_UPDATED'
  | 'NOTIFIED'
  | 'ERROR'

export interface ChaseContext {
  now: number
  /** Number of follow-ups already sent. */
  followUps?: number
  /** Max follow-ups before giving up (default 2). */
  maxFollowUps?: number
  /** Base follow-up delay in ms (default 48h). */
  followUpDelayMs?: number
  error?: string
  /** Parsed reply payload, set by the parse step. */
  parsed?: Record<string, unknown>
}

export type ChaseEffect =
  | { kind: 'draft_outreach' }
  | { kind: 'send_outreach'; followUp: boolean }
  | { kind: 'parse_reply' }
  | { kind: 'validate_reply' }
  | { kind: 'update_entity' }
  | { kind: 'notify' }
  | { kind: 'give_up' }

export interface Transition {
  next: ChaseState
  effects: ChaseEffect[]
  /** Optional delay before running the next state's step (followup backoff). */
  delayMs?: number
  contextPatch?: Partial<ChaseContext>
}

const FOLLOW_UP_BASE_MS = 48 * 60 * 60 * 1000

/** Pure transition table. Returns null when (state, event) is invalid. */
export function transition(
  state: ChaseState,
  event: ChaseEvent,
  ctx: ChaseContext,
): Transition | null {
  switch (state) {
    case 'intake':
      if (event === 'INTAKE_OK') return { next: 'outreach', effects: [{ kind: 'draft_outreach' }] }
      break
    case 'outreach':
      if (event === 'DRAFT_SENT') return { next: 'await_reply', effects: [] }
      break
    case 'await_reply':
      if (event === 'REPLY_RECEIVED') return { next: 'parse', effects: [{ kind: 'parse_reply' }] }
      if (event === 'FOLLOWUP_DUE') {
        const followUps = ctx.followUps ?? 0
        const max = ctx.maxFollowUps ?? 2
        if (followUps >= max) return { next: 'failed', effects: [{ kind: 'give_up' }] }
        return {
          next: 'followup',
          effects: [{ kind: 'send_outreach', followUp: true }],
          contextPatch: { followUps: followUps + 1 },
        }
      }
      break
    case 'followup':
      if (event === 'FOLLOWUP_SENT') {
        // Backoff doubles per follow-up.
        const n = ctx.followUps ?? 1
        const base = ctx.followUpDelayMs ?? FOLLOW_UP_BASE_MS
        return { next: 'await_reply', effects: [], delayMs: base * 2 ** (n - 1) }
      }
      break
    case 'parse':
      if (event === 'REPLY_PARSED') return { next: 'validate', effects: [{ kind: 'validate_reply' }] }
      if (event === 'REPLY_INVALID') return { next: 'failed', effects: [{ kind: 'give_up' }] }
      break
    case 'validate':
      if (event === 'VALIDATED') return { next: 'update', effects: [{ kind: 'update_entity' }] }
      if (event === 'REPLY_INVALID') return { next: 'failed', effects: [{ kind: 'give_up' }] }
      break
    case 'update':
      if (event === 'ENTITY_UPDATED') return { next: 'notify', effects: [{ kind: 'notify' }] }
      break
    case 'notify':
      if (event === 'NOTIFIED') return { next: 'done', effects: [] }
      break
    default:
      break
  }
  if (event === 'ERROR') return { next: 'failed', effects: [] }
  return null
}

/** Legal states for the template registry. */
export const CHASE_STATES: readonly ChaseState[] = [
  'intake',
  'outreach',
  'await_reply',
  'followup',
  'parse',
  'validate',
  'update',
  'notify',
  'done',
  'failed',
]
