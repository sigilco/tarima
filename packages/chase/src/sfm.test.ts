import { describe, expect, it } from 'vitest'
import { transition, type ChaseContext, type ChaseState } from './sfm'

const ctx = (over: Partial<ChaseContext> = {}): ChaseContext => ({ now: 0, ...over })

describe('chase SFM transitions', () => {
  it('walks the happy path', () => {
    let state: ChaseState = 'intake'
    const steps: Array<[ChaseState, Parameters<typeof transition>[1]]> = [
      ['intake', 'INTAKE_OK'],
      ['outreach', 'DRAFT_SENT'],
      ['await_reply', 'REPLY_RECEIVED'],
      ['parse', 'REPLY_PARSED'],
      ['validate', 'VALIDATED'],
      ['update', 'ENTITY_UPDATED'],
      ['notify', 'NOTIFIED'],
    ]
    for (const [expectedState, event] of steps) {
      expect(state).toBe(expectedState)
      const t = transition(state, event, ctx())
      expect(t).not.toBeNull()
      state = t!.next
    }
    expect(state).toBe('done')
  })

  it('branches to followup with doubling backoff, then gives up after max', () => {
    const t1 = transition('await_reply', 'FOLLOWUP_DUE', ctx({ followUps: 0 }))
    expect(t1?.next).toBe('followup')
    expect(t1?.contextPatch?.followUps).toBe(1)
    const t2 = transition('followup', 'FOLLOWUP_SENT', ctx({ followUps: 1 }))
    expect(t2?.next).toBe('await_reply')
    expect(t2?.delayMs).toBe(48 * 60 * 60 * 1000)
    // max 2 reached -> give up
    const t3 = transition('await_reply', 'FOLLOWUP_DUE', ctx({ followUps: 2, maxFollowUps: 2 }))
    expect(t3?.next).toBe('failed')
    expect(t3?.effects).toEqual([{ kind: 'give_up' }])
  })

  it('rejects invalid transitions and routes ERROR to failed', () => {
    expect(transition('intake', 'REPLY_RECEIVED', ctx())).toBeNull()
    expect(transition('parse', 'ERROR', ctx())?.next).toBe('failed')
  })

  it('send_outreach effect carries followup flag', () => {
    const t = transition('await_reply', 'FOLLOWUP_DUE', ctx({ followUps: 1 }))
    expect(t?.effects).toEqual([{ kind: 'send_outreach', followUp: true }])
  })
})
