import * as v from "valibot";
import {
  DRAFT_OUTREACH_SYSTEM,
  PARSE_REPLY_SYSTEM,
  PARSE_BRIEF_SYSTEM,
  draftOutreachUser,
  parseBriefUser,
  parseReplyUser,
} from "./prompts";
import type { DraftOutreachInput, OutreachDraft, ParsedBrief, ParsedReply } from "./types";

/**
 * The two chase tasks. Both are schema-validated on the way back in: a
 * model that returns prose instead of JSON must not be able to push junk
 * into the entity row.
 */

export const parsedReplySchema = v.object({
  answered: v.boolean(),
  fields: v.record(v.string(), v.unknown()),
  confidence: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
});
export type ParsedReplyOutput = v.InferOutput<typeof parsedReplySchema>;

export const outreachDraftSchema = v.object({
  subject: v.string(),
  body: v.string(),
});
export type OutreachDraftOutput = v.InferOutput<typeof outreachDraftSchema>;

/** Pull the first JSON object out of a model response. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("llm response contained no JSON object");
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

/** Validate a parseReply model response. */
export function validateParsedReply(value: unknown): ParsedReply {
  const parsed = v.parse(parsedReplySchema, value);
  return {
    answered: parsed.answered,
    fields: parsed.fields,
    confidence: parsed.confidence,
  };
}

export const parsedBriefSchema = v.object({
  eventType: v.string(),
  city: v.string(),
  date: v.optional(v.string()),
  headcount: v.pipe(v.number(), v.integer(), v.minValue(1)),
  budgetAmount: v.pipe(v.number(), v.minValue(0)),
  currency: v.pipe(v.string(), v.regex(/^[A-Z]{3}$/)),
  venueRequirements: v.optional(v.string()),
  notes: v.optional(v.string()),
  confidence: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
});

/** Validate a parseBrief model response. */
export function validateParsedBrief(value: unknown): ParsedBrief {
  return v.parse(parsedBriefSchema, value);
}

/** Validate a draftOutreach model response. */
export function validateOutreachDraft(value: unknown): OutreachDraft {
  const parsed = v.parse(outreachDraftSchema, value);
  return { subject: parsed.subject, body: parsed.body };
}

/** Prompt text for the parseReply task. */
export function buildParseReplyPrompt(
  body: string,
  goal: Record<string, unknown>,
): {
  system: string;
  user: string;
} {
  return { system: PARSE_REPLY_SYSTEM, user: parseReplyUser(body, goal) };
}

/** Prompt text for the draftOutreach task. */
export function buildDraftOutreachPrompt(input: DraftOutreachInput): {
  system: string;
  user: string;
} {
  return { system: DRAFT_OUTREACH_SYSTEM, user: draftOutreachUser(input) };
}

/** Prompt text for the parseBrief task. */
export function buildParseBriefPrompt(text: string): { system: string; user: string } {
  return { system: PARSE_BRIEF_SYSTEM, user: parseBriefUser(text) };
}
