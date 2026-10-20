/**
 * LLM seam. packages/llm arrives later; chase depends only on this
 * interface so providers are injected at wiring time.
 */

export interface DraftOutreachInput {
  entityName: string
  goal: Record<string, unknown>
  isFollowUp: boolean
  followUpNumber?: number
}

export interface OutreachDraft {
  subject: string
  body: string
}

export interface ParsedReply {
  /** Did the reply actually answer the chase (deliverables status, etc.)? */
  answered: boolean
  /** Extracted fields to write onto the entity. */
  fields: Record<string, unknown>
  confidence: number
}

/** Providers implement these; tests pass fakes. */
export interface ChaseLlm {
  draftOutreach(input: DraftOutreachInput): Promise<OutreachDraft>
  parseReply(body: string, goal: Record<string, unknown>): Promise<ParsedReply>
}

/** Deterministic stub used until @tarima/llm lands. */
export const stubLlm: ChaseLlm = {
  async draftOutreach(input): Promise<OutreachDraft> {
    const subject = input.isFollowUp
      ? `Re: deliverables for ${input.entityName} (following up)`
      : `Deliverables for ${input.entityName}`
    const body = input.isFollowUp
      ? `Hi ${input.entityName}, following up on my previous note about the deliverables.`
      : `Hi ${input.entityName}, we still need the deliverables for the event.`
    return { subject, body }
  },
  async parseReply(body): Promise<ParsedReply> {
    const positive = /done|sent|attached|complete/i.test(body)
    return {
      answered: positive,
      fields: positive ? { deliverables: 'received' } : {},
      confidence: positive ? 0.9 : 0.3,
    }
  },
}
