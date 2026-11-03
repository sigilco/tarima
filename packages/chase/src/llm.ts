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
 * A free-text brief parsed into the structured spec the confirm step
 * parks for user review. The shape mirrors `@tarima/contract`'s
 * `briefSchema` loosely: the parser returns what it could read, the
 * api validates the result against the contract schema before storing.
 */
export interface ParsedBrief {
  eventType: string;
  city: string;
  /** ISO date, when the text pins one day. */
  date?: string;
  headcount: number;
  budgetAmount: number;
  currency: string;
  venueRequirements?: string;
  notes?: string;
  confidence: number;
}

/** Providers implement these; tests pass fakes. */
export interface ChaseLlm {
  draftOutreach(input: DraftOutreachInput): Promise<OutreachDraft>;
  parseReply(body: string, goal: Record<string, unknown>): Promise<ParsedReply>;
  /** Parse a free-text event brief into the confirm-step spec. */
  parseBrief?(text: string): Promise<ParsedBrief>;
}

/**
 * Deterministic brief parser used until an LLM provider implements
 * `parseBrief`. It reads the obvious signals out of tester-style text
 * ("40-person offsite in Malaga on 2026-12-05, 5k EUR budget") and
 * falls back to safe defaults for anything it cannot read, so the
 * confirm step always has a draft spec to show.
 */
export const stubParseBrief = async (text: string): Promise<ParsedBrief> => {
  const headcount = Number(
    /(\d{1,6})\s*(?:pax|people|persons|guests|attendees|-?\s*person\b)/i.exec(text)?.[1] ?? 20,
  );
  const budget = Number(
    /(?:budget[^.\d]*|[$€£])(\d[\d,.]*)\s*(k)?/i.exec(text)?.[0]?.replace(/[^\d.]/g, "") ?? 5000,
  );
  const iso = /\d{4}-\d{2}-\d{2}/.exec(text)?.[0];
  const currency = /€|eur/i.test(text) ? "EUR" : /£|gbp/i.test(text) ? "GBP" : "USD";
  const city = /\bin\s+([A-Z][a-zA-Zà-ÿ' ]{2,40})/.exec(text)?.[1]?.trim() ?? "Malaga";
  return {
    eventType: /offsite/i.test(text) ? "offsite" : "meetup",
    city,
    ...(iso ? { date: iso } : {}),
    headcount: Number.isFinite(headcount) ? headcount : 20,
    budgetAmount: Number.isFinite(budget) ? budget : 5000,
    currency,
    notes: text.slice(0, 4000),
    confidence: 0.5,
  };
};

/** Deterministic stub used until @tarima/llm lands. */
export const stubLlm: ChaseLlm = {
  async draftOutreach(input): Promise<OutreachDraft> {
    const subject = input.isFollowUp
      ? `Re: deliverables for ${input.entityName} (following up)`
      : `Deliverables for ${input.entityName}`;
    const body = input.isFollowUp
      ? `Hi ${input.entityName}, following up on my previous note about the deliverables.`
      : `Hi ${input.entityName}, we still need the deliverables for the event.`;
    return { subject, body };
  },
  async parseReply(body): Promise<ParsedReply> {
    const positive = /done|sent|attached|complete/i.test(body);
    return {
      answered: positive,
      fields: positive ? { deliverables: "received" } : {},
      confidence: positive ? 0.9 : 0.3,
    };
  },
  parseBrief: stubParseBrief,
};
