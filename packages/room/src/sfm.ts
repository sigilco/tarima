/**
 * Negotiation room state machine (SFM).
 *
 * States aligned with NEGOTIATION_STATUSES in @tarima/contract:
 * - pending_audit: proposal received, awaiting automated audit
 * - requires_approval: audit complete, waiting for HITL approval
 * - revising: feedback received, negotiator redrafting
 * - counter_proposed: counter approved by client/organizer, staged
 * - accepted: vendor accepted the counter proposal (terminal)
 * - rejected: venue dropped/declined (terminal)
 * - sent: approved counter dispatched to vendor (terminal)
 *
 * Hard HITL rule: the ONLY path to sent is:
 *   requires_approval -> (APPROVED) -> counter_proposed -> (COUNTER_SENT) -> sent
 * Nothing auto-sends. Rejected is terminal.
 * Comment from requires_approval -> revising.
 * REVISION_DRAFTED -> requires_approval with revision+1 in ctx.
 *
 * All transitions are pure: (state, event, ctx) -> { next, effects } | null.
 */
import { NEGOTIATION_STATUSES, type NegotiationStatus } from "@tarima/contract";

export type NegotiationState = NegotiationStatus;

export const NEGOTIATION_STATES: readonly NegotiationState[] = NEGOTIATION_STATUSES;

export type NegotiationEventName =
  | "AUDIT_OK"
  | "AUDIT_FAILED"
  | "APPROVED"
  | "REJECTED"
  | "COMMENT_RECEIVED"
  | "REVISION_DRAFTED"
  | "COUNTER_SENT"
  | "VENDOR_ACCEPTED"
  | "ERROR";

export type NegotiationEvent =
  | NegotiationEventName
  | {
      type: NegotiationEventName;
      decision?: string;
      text?: string;
      by?: string;
      [key: string]: unknown;
    };

export interface NegotiationContext {
  now: number;
  revision?: number;
  error?: string;
  feedback?: string;
  decision?: string;
  [key: string]: unknown;
}

export type NegotiationEffect =
  | { kind: "run_audit" }
  | { kind: "draft_counter" }
  | { kind: "record_feedback"; text?: string; by?: string }
  | { kind: "stage_counter" }
  | { kind: "send_counter" }
  | { kind: "record_decision"; decision?: string; by?: string };

export interface Transition {
  next: NegotiationState;
  effects: NegotiationEffect[];
  delayMs?: number;
  contextPatch?: Partial<NegotiationContext>;
}

function eventName(event: NegotiationEvent): NegotiationEventName {
  return typeof event === "string" ? event : event.type;
}

/** Pure transition table. Returns null when (state, event) is invalid. */
export function transition(
  state: NegotiationState,
  event: NegotiationEvent,
  ctx: NegotiationContext,
): Transition | null {
  const ev = eventName(event);

  // Terminal states allow no further transitions under any event.
  if (state === "rejected" || state === "accepted") {
    return null;
  }

  // Generic ERROR routes active (non-terminal) states to rejected.
  if (ev === "ERROR") {
    return { next: "rejected", effects: [] };
  }

  switch (state) {
    case "pending_audit":
      if (ev === "AUDIT_OK") {
        return { next: "requires_approval", effects: [{ kind: "draft_counter" }] };
      }
      if (ev === "AUDIT_FAILED") {
        return { next: "rejected", effects: [{ kind: "record_decision" }] };
      }
      break;

    case "requires_approval":
      if (ev === "APPROVED") {
        return { next: "counter_proposed", effects: [{ kind: "stage_counter" }] };
      }
      if (ev === "REJECTED") {
        return { next: "rejected", effects: [{ kind: "record_decision" }] };
      }
      if (ev === "COMMENT_RECEIVED") {
        return { next: "revising", effects: [{ kind: "record_feedback" }] };
      }
      break;

    case "revising":
      if (ev === "REVISION_DRAFTED") {
        const nextRev = (ctx.revision ?? 0) + 1;
        return {
          next: "requires_approval",
          effects: [{ kind: "draft_counter" }],
          contextPatch: { revision: nextRev },
        };
      }
      if (ev === "COMMENT_RECEIVED") {
        return { next: "revising", effects: [{ kind: "record_feedback" }] };
      }
      if (ev === "REJECTED") {
        return { next: "rejected", effects: [{ kind: "record_decision" }] };
      }
      break;

    case "counter_proposed":
      if (ev === "COUNTER_SENT") {
        return { next: "sent", effects: [{ kind: "send_counter" }] };
      }
      if (ev === "REJECTED") {
        return { next: "rejected", effects: [{ kind: "record_decision" }] };
      }
      if (ev === "COMMENT_RECEIVED") {
        return { next: "revising", effects: [{ kind: "record_feedback" }] };
      }
      break;

    case "sent":
      if (ev === "VENDOR_ACCEPTED") {
        return { next: "accepted", effects: [{ kind: "record_decision" }] };
      }
      if (ev === "REJECTED") {
        return { next: "rejected", effects: [{ kind: "record_decision" }] };
      }
      if (ev === "COMMENT_RECEIVED") {
        return { next: "revising", effects: [{ kind: "record_feedback" }] };
      }
      break;

    default:
      break;
  }

  return null;
}
