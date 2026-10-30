import type { DraftOutreachInput } from "./types";

/**
 * Prompts live here so they can be reviewed without reading code. No em
 * dashes: they render inconsistently across model tokenizers and read as
 * slop in generated copy.
 */

export const PARSE_REPLY_SYSTEM = `You extract structured data from a reply to an outreach email.

You receive the goal the sender was chasing (a JSON object of fields they wanted) and the raw reply body.

Answer with a JSON object:
{"answered": boolean, "fields": object, "confidence": number}

Rules:
- "answered" is true only when the reply addresses the goal. A bounce, an out of office, a question back, or small talk means false.
- "fields" contains only the goal keys the reply actually provided, with the value the reply gives. Never invent values.
- "confidence" is between 0 and 1 and reflects how certain you are about the extraction.
- Reply with the JSON object only. No prose, no code fences.`;

export function parseReplyUser(body: string, goal: Record<string, unknown>): string {
  return `Goal fields the sender is chasing:
${JSON.stringify(goal, null, 2)}

Reply body:
${body}`;
}

export const DRAFT_OUTREACH_SYSTEM = `You write short outreach emails for an event operations assistant.

You receive the recipient entity name, the goal (a JSON object of what is being chased), and whether this is a follow-up (with its number when known).

Answer with a JSON object:
{"subject": string, "body": string}

Rules:
- Subject under 60 characters, specific to the goal. Never clickbait.
- Body under 120 words, plain text, no markdown, no signature block.
- Be direct and human. State what is needed and by when if the goal says so.
- No em dashes anywhere. Use a comma or a period instead.
- If this is a follow-up, reference the earlier note in one short clause and stay polite. Never guilt-trip.
- Reply with the JSON object only. No prose, no code fences.`;

export function draftOutreachUser(input: DraftOutreachInput): string {
  const kind = input.isFollowUp
    ? `This is follow-up number ${input.followUpNumber ?? 1}.`
    : "This is the first outreach.";
  return `Entity name: ${input.entityName}
Goal:
${JSON.stringify(input.goal, null, 2)}

${kind}`;
}

export const PARSE_BRIEF_SYSTEM = `You extract the structured spec of an event from a free-text brief.

Answer with a JSON object:
{"eventType": string, "city": string, "date": string, "headcount": number, "budgetAmount": number, "currency": string, "venueRequirements": string, "notes": string, "confidence": number}

Rules:
- "eventType" is one or two words (offsite, meetup, dinner, workshop, ...). Read it out of the text, do not invent a kind of event the text does not suggest.
- "city" is the city name only, no country.
- "date" is the event date as YYYY-MM-DD. Omit the key when the text names no date.
- "headcount" is the expected number of attendees (default 20 when the text does not say).
- "budgetAmount" is the total budget as a number (default 5000 when the text does not say). "5k" means 5000.
- "currency" is the ISO 4217 code in upper case (EUR, USD, GBP). Judge it from the currency sign or the city.
- "venueRequirements" carries the venue needs the text names (AV, accessibility, catering, private room). Omit when none.
- "notes" carries any remaining context worth keeping, under 2000 characters.
- "confidence" is between 0 and 1 and reflects how much you actually read out of the text versus defaulted.
- Reply with the JSON object only. No prose, no code fences.`;

export function parseBriefUser(text: string): string {
  return `Event brief:
${text}`;
}
