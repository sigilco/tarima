import type { NegotiationContext, NegotiationEvent, NegotiationState } from "./sfm";
import { transition } from "./sfm";

/**
 * Step key per state: engine handlers resolve via this mapping.
 * Returns:
 * - room.audit for pending_audit
 * - room.counter for counter_proposed
 * - room.revise for revising
 * - room.decide for requires_approval (and other decision states)
 */
export function stepFor(state: NegotiationState): string {
  switch (state) {
    case "pending_audit":
      return "room.audit";
    case "counter_proposed":
      return "room.counter";
    case "revising":
      return "room.revise";
    case "requires_approval":
    default:
      return "room.decide";
  }
}

/**
 * Negotiation workflow template. Maps SFM states to engine step keys
 * and carries event dispatch through the pure transition table.
 */
export const NEGOTIATION = {
  type: "negotiation",
  states: ["pending_audit", "requires_approval", "revising", "counter_proposed"] as const,
  stepFor,
  dispatch(
    state: NegotiationState,
    event: NegotiationEvent,
    ctx: NegotiationContext,
  ): {
    next: NegotiationState;
    effects: ReturnType<typeof transition> extends null
      ? never
      : NonNullable<ReturnType<typeof transition>>["effects"];
  } | null {
    const t = transition(state, event, ctx);
    if (!t) return null;
    return { next: t.next, effects: t.effects };
  },
};
