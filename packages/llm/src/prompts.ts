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
