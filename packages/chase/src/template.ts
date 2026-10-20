import type { ChaseContext, ChaseEvent, ChaseState } from "./sfm";
import { transition } from "./sfm";

/**
 * chase-deliverables workflow template. Maps SFM states to engine step keys
 * and carries event dispatch through the pure transition table.
 */
export const CHASE_DELIVERABLES = {
  type: "chase-deliverables",
  states: [
    "intake",
    "outreach",
    "await_reply",
    "followup",
    "parse",
    "validate",
    "update",
    "notify",
  ] as const,
  /** Step key per state: engine handlers resolve via this mapping. */
  stepFor(state: ChaseState): string {
    return `chase.${state}`;
  },
  dispatch(
    state: ChaseState,
    event: ChaseEvent,
    ctx: ChaseContext,
  ): {
    next: ChaseState;
    effects: ReturnType<typeof transition> extends null
      ? never
      : NonNullable<ReturnType<typeof transition>>["effects"];
  } | null {
    const t = transition(state, event, ctx);
    if (!t) return null;
    return { next: t.next, effects: t.effects };
  },
};
