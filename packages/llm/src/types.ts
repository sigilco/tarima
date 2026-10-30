/**
 * LLM provider contract for the chase pipeline. Structurally identical to
 * `ChaseLlm` in @tarima/chase but defined here on purpose: chase depends on
 * this interface at wiring time, so this package must never import chase
 * (that would be a dependency cycle). Structural typing makes any
 * `LlmProvider` assignable to `ChaseLlm` with no change to chase.
 */

export interface DraftOutreachInput {
  entityName: string;
  goal: Record<string, unknown>;
  isFollowUp: boolean;
  followUpNumber?: number;
}

export interface OutreachDraft {
  subject: string;
  body: string;
}

export interface ParsedReply {
  /** Did the reply actually answer the chase (deliverables status, etc.)? */
  answered: boolean;
  /** Extracted fields to write onto the entity. */
  fields: Record<string, unknown>;
  confidence: number;
}

/**
 * A free-text event brief parsed into the structured spec the confirm
 * step parks for user review. Mirrors the optional shape of the
 * contract's brief record (date and the long free-text fields are the
 * parser's best effort; the api validates against `briefSchema`
 * before storing and shows the result for confirmation either way).
 */
export interface ParsedBrief {
  eventType: string;
  city: string;
  date?: string;
  headcount: number;
  budgetAmount: number;
  currency: string;
  venueRequirements?: string;
  notes?: string;
  confidence: number;
}

export interface LlmProvider {
  draftOutreach(i: DraftOutreachInput): Promise<OutreachDraft>;
  parseReply(body: string, goal: Record<string, unknown>): Promise<ParsedReply>;
  /** Parse a free-text event brief into the confirm-step spec. */
  parseBrief(text: string): Promise<ParsedBrief>;
}
