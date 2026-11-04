import { describe, expect, it } from "vitest";
import {
  NEGOTIATION_STATES,
  transition,
  type NegotiationContext,
  type NegotiationEvent,
  type NegotiationState,
} from "./sfm";
import { NEGOTIATION, stepFor } from "./template";

const ctx = (over: Partial<NegotiationContext> = {}): NegotiationContext => ({
  now: 0,
  ...over,
});

describe("negotiation SFM - valid paths", () => {
  it("walks the full happy path to vendor acceptance", () => {
    let state: NegotiationState = "pending_audit";
    const steps: Array<[NegotiationState, NegotiationEvent, NegotiationState]> = [
      ["pending_audit", "AUDIT_OK", "requires_approval"],
      ["requires_approval", "APPROVED", "counter_proposed"],
      ["counter_proposed", "COUNTER_SENT", "sent"],
      ["sent", "VENDOR_ACCEPTED", "accepted"],
    ];

    for (const [from, event, expectedNext] of steps) {
      expect(state).toBe(from);
      const t = transition(state, event, ctx());
      expect(t).not.toBeNull();
      expect(t!.next).toBe(expectedNext);
      state = t!.next;
    }
    expect(state).toBe("accepted");
  });

  it("walks the revision feedback path back to approval gate", () => {
    let state: NegotiationState = "pending_audit";
    const steps: Array<[NegotiationState, NegotiationEvent, NegotiationState]> = [
      ["pending_audit", "AUDIT_OK", "requires_approval"],
      ["requires_approval", "COMMENT_RECEIVED", "revising"],
      ["revising", "REVISION_DRAFTED", "requires_approval"],
      ["requires_approval", "APPROVED", "counter_proposed"],
      ["counter_proposed", "COUNTER_SENT", "sent"],
    ];

    for (const [from, event, expectedNext] of steps) {
      expect(state).toBe(from);
      const t = transition(state, event, ctx({ revision: 0 }));
      expect(t).not.toBeNull();
      expect(t!.next).toBe(expectedNext);
      state = t!.next;
    }
    expect(state).toBe("sent");
  });

  it("handles audit failure routing to rejected", () => {
    const t = transition("pending_audit", "AUDIT_FAILED", ctx());
    expect(t).not.toBeNull();
    expect(t!.next).toBe("rejected");
    expect(t!.effects).toEqual([{ kind: "record_decision" }]);
  });

  it("supports REJECTED decision object payload", () => {
    const t = transition(
      "requires_approval",
      { type: "REJECTED", decision: "budget too high" },
      ctx(),
    );
    expect(t).not.toBeNull();
    expect(t!.next).toBe("rejected");
    expect(t!.effects).toEqual([{ kind: "record_decision" }]);
  });
});

describe("negotiation SFM - invalid pairs return null", () => {
  it("rejects illegal state-event combinations", () => {
    expect(transition("pending_audit", "APPROVED", ctx())).toBeNull();
    expect(transition("pending_audit", "COUNTER_SENT", ctx())).toBeNull();
    expect(transition("pending_audit", "VENDOR_ACCEPTED", ctx())).toBeNull();
    expect(transition("pending_audit", "REVISION_DRAFTED", ctx())).toBeNull();

    expect(transition("requires_approval", "AUDIT_OK", ctx())).toBeNull();
    expect(transition("requires_approval", "COUNTER_SENT", ctx())).toBeNull();
    expect(transition("requires_approval", "VENDOR_ACCEPTED", ctx())).toBeNull();

    expect(transition("revising", "APPROVED", ctx())).toBeNull();
    expect(transition("revising", "COUNTER_SENT", ctx())).toBeNull();
    expect(transition("revising", "AUDIT_OK", ctx())).toBeNull();

    expect(transition("counter_proposed", "APPROVED", ctx())).toBeNull();
    expect(transition("counter_proposed", "AUDIT_OK", ctx())).toBeNull();
    expect(transition("counter_proposed", "REVISION_DRAFTED", ctx())).toBeNull();

    expect(transition("sent", "APPROVED", ctx())).toBeNull();
    expect(transition("sent", "COUNTER_SENT", ctx())).toBeNull();
    expect(transition("sent", "AUDIT_OK", ctx())).toBeNull();
  });
});

describe("negotiation SFM - sent path requires explicit approval (Hard HITL rule)", () => {
  it("requires_approval cannot transition directly to sent", () => {
    expect(transition("requires_approval", "COUNTER_SENT", ctx())).toBeNull();
  });

  it("pending_audit cannot skip to counter_proposed or sent", () => {
    expect(transition("pending_audit", "COUNTER_SENT", ctx())).toBeNull();
    expect(transition("pending_audit", "APPROVED", ctx())).toBeNull();
  });

  it("revising cannot skip to counter_proposed or sent", () => {
    expect(transition("revising", "COUNTER_SENT", ctx())).toBeNull();
    expect(transition("revising", "APPROVED", ctx())).toBeNull();
  });

  it("APPROVED only stages the counter proposal, does not send", () => {
    const t = transition("requires_approval", "APPROVED", ctx());
    expect(t?.next).toBe("counter_proposed");
    expect(t?.effects).toEqual([{ kind: "stage_counter" }]);
    expect(t?.effects.some((e) => e.kind === "send_counter")).toBe(false);
  });

  it("only counter_proposed can transition to sent on COUNTER_SENT", () => {
    const t = transition("counter_proposed", "COUNTER_SENT", ctx());
    expect(t?.next).toBe("sent");
    expect(t?.effects).toEqual([{ kind: "send_counter" }]);
  });
});

describe("negotiation SFM - rejected is terminal", () => {
  const allEvents: NegotiationEvent[] = [
    "AUDIT_OK",
    "AUDIT_FAILED",
    "APPROVED",
    "REJECTED",
    "COMMENT_RECEIVED",
    "REVISION_DRAFTED",
    "COUNTER_SENT",
    "VENDOR_ACCEPTED",
    "ERROR",
  ];

  it("returns null for all events when state is rejected", () => {
    for (const event of allEvents) {
      expect(transition("rejected", event, ctx())).toBeNull();
    }
  });

  it("rejection from any active state terminates with record_decision", () => {
    const activeStates: NegotiationState[] = [
      "requires_approval",
      "revising",
      "counter_proposed",
      "sent",
    ];

    for (const state of activeStates) {
      const t = transition(state, "REJECTED", ctx());
      expect(t).not.toBeNull();
      expect(t!.next).toBe("rejected");
      expect(t!.effects).toEqual([{ kind: "record_decision" }]);
    }
  });
});

describe("negotiation SFM - revision increments", () => {
  it("increments revision when undefined or missing", () => {
    const t = transition("revising", "REVISION_DRAFTED", ctx());
    expect(t?.next).toBe("requires_approval");
    expect(t?.contextPatch?.revision).toBe(1);
  });

  it("increments revision from 0 to 1", () => {
    const t = transition("revising", "REVISION_DRAFTED", ctx({ revision: 0 }));
    expect(t?.next).toBe("requires_approval");
    expect(t?.contextPatch?.revision).toBe(1);
  });

  it("increments revision across multiple revision cycles", () => {
    const t1 = transition("revising", "REVISION_DRAFTED", ctx({ revision: 1 }));
    expect(t1?.contextPatch?.revision).toBe(2);

    const t2 = transition("revising", "REVISION_DRAFTED", ctx({ revision: 2 }));
    expect(t2?.contextPatch?.revision).toBe(3);
  });
});

describe("negotiation template", () => {
  it("maps states to correct step keys", () => {
    expect(stepFor("pending_audit")).toBe("room.audit");
    expect(stepFor("counter_proposed")).toBe("room.counter");
    expect(stepFor("revising")).toBe("room.revise");
    expect(stepFor("requires_approval")).toBe("room.decide");
    expect(stepFor("sent")).toBe("room.decide");
  });

  it("template metadata and dispatch work as expected", () => {
    expect(NEGOTIATION.type).toBe("negotiation");
    expect(NEGOTIATION.stepFor("pending_audit")).toBe("room.audit");

    const res = NEGOTIATION.dispatch("pending_audit", "AUDIT_OK", ctx());
    expect(res).not.toBeNull();
    expect(res!.next).toBe("requires_approval");
    expect(res!.effects).toEqual([{ kind: "draft_counter" }]);

    expect(NEGOTIATION.dispatch("pending_audit", "APPROVED", ctx())).toBeNull();
  });

  it("exposes all contract negotiation statuses", () => {
    expect(NEGOTIATION_STATES).toContain("pending_audit");
    expect(NEGOTIATION_STATES).toContain("requires_approval");
    expect(NEGOTIATION_STATES).toContain("revising");
    expect(NEGOTIATION_STATES).toContain("counter_proposed");
    expect(NEGOTIATION_STATES).toContain("accepted");
    expect(NEGOTIATION_STATES).toContain("rejected");
    expect(NEGOTIATION_STATES).toContain("sent");
  });
});
