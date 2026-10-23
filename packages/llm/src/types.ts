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

export interface LlmProvider {
  draftOutreach(i: DraftOutreachInput): Promise<OutreachDraft>;
  parseReply(body: string, goal: Record<string, unknown>): Promise<ParsedReply>;
}
