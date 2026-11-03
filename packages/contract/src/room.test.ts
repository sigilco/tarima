import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as v from "valibot";
import {
  NEGOTIATION_STATUSES,
  activityActorSchema,
  activityEventSchema,
  agentAttributionSchema,
  auditResultSchema,
  createNegotiationSchema,
  eventSpecsSchema,
  feedbackKindSchema,
  negotiationRowSchema,
  negotiationSchema,
  negotiationStatusSchema,
  proposalFeedbackSchema,
  roomIncomingSchema,
  roomOutgoingSchema,
  roomRoleSchema,
  roomSnapshotSchema,
  roomSocketMetadataSchema,
  updateNegotiationSchema,
} from "./room.ts";

const VALID_UUID_1 = "11111111-1111-4111-8111-111111111111";
const VALID_UUID_2 = "22222222-2222-4222-8222-222222222222";
const VALID_UUID_3 = "33333333-3333-4333-8333-333333333333";
const VALID_UUID_4 = "44444444-4444-4444-8444-444444444444";
const INVALID_UUID = "not-a-uuid-string";

describe("Negotiation status schema", () => {
  it("accepts all 7 lowercase snake_case negotiation statuses", () => {
    for (const status of NEGOTIATION_STATUSES) {
      const result = v.safeParse(negotiationStatusSchema, status);
      assert.equal(result.success, true, `Expected status ${status} to be valid`);
      if (result.success) {
        assert.equal(result.output, status);
      }
    }
  });

  it("includes distinct terminal sent status", () => {
    assert.equal(NEGOTIATION_STATUSES.includes("sent"), true);
    assert.equal(NEGOTIATION_STATUSES.includes("rejected"), true);
  });

  it("rejects legacy uppercase tarima2 statuses", () => {
    const uppercase = [
      "PENDING_AUDIT",
      "REQUIRES_APPROVAL",
      "REVISING",
      "COUNTER_PROPOSED",
      "ACCEPTED",
      "REJECTED",
    ];
    for (const status of uppercase) {
      const result = v.safeParse(negotiationStatusSchema, status);
      assert.equal(result.success, false, `Expected legacy status ${status} to be rejected`);
    }
  });

  it("rejects arbitrary unknown statuses", () => {
    const result = v.safeParse(negotiationStatusSchema, "unknown_status");
    assert.equal(result.success, false);
  });
});

describe("Roles and actors schemas", () => {
  it("accepts valid room roles", () => {
    for (const role of ["agency", "client", "organizer", "owner", "observer"]) {
      assert.equal(v.safeParse(roomRoleSchema, role).success, true);
    }
    assert.equal(v.safeParse(roomRoleSchema, "intruder").success, false);
  });

  it("accepts valid activity actors", () => {
    for (const actor of [
      "scout",
      "finance",
      "negotiator",
      "client",
      "agency",
      "organizer",
      "owner",
      "system",
    ]) {
      assert.equal(v.safeParse(activityActorSchema, actor).success, true);
    }
    assert.equal(v.safeParse(activityActorSchema, "robot").success, false);
  });
});

describe("Proposal feedback and audit schemas", () => {
  it("accepts valid feedback kinds", () => {
    assert.equal(v.safeParse(feedbackKindSchema, "comment").success, true);
    assert.equal(v.safeParse(feedbackKindSchema, "reject").success, true);
    assert.equal(v.safeParse(feedbackKindSchema, "unknown").success, false);
  });

  it("accepts valid proposal feedback with ISO timestamp", () => {
    const valid = {
      id: VALID_UUID_1,
      at: "2026-11-03T12:00:00.000Z",
      by: "client",
      kind: "comment",
      text: "Can we negotiate a lower minimum spend?",
    };
    const result = v.safeParse(proposalFeedbackSchema, valid);
    assert.equal(result.success, true);
  });

  it("accepts valid proposal feedback with epoch ms timestamp", () => {
    const valid = {
      id: VALID_UUID_1,
      at: 1793746384000,
      by: "agency",
      kind: "reject",
      text: "Venue does not allow outside catering.",
    };
    const result = v.safeParse(proposalFeedbackSchema, valid);
    assert.equal(result.success, true);
  });

  it("rejects proposal feedback with invalid UUID id", () => {
    const invalid = {
      id: INVALID_UUID,
      at: 1793746384000,
      by: "client",
      kind: "comment",
      text: "Please check curfew.",
    };
    const result = v.safeParse(proposalFeedbackSchema, invalid);
    assert.equal(result.success, false);
  });

  it("rejects proposal feedback with invalid kind", () => {
    const invalid = {
      id: VALID_UUID_1,
      at: 1793746384000,
      by: "client",
      kind: "praise",
      text: "Great venue!",
    };
    const result = v.safeParse(proposalFeedbackSchema, invalid);
    assert.equal(result.success, false);
  });

  it("rejects proposal feedback with empty text", () => {
    const invalid = {
      id: VALID_UUID_1,
      at: 1793746384000,
      by: "client",
      kind: "comment",
      text: "",
    };
    const result = v.safeParse(proposalFeedbackSchema, invalid);
    assert.equal(result.success, false);
  });

  it("accepts valid audit result", () => {
    const valid = {
      budgetDelta: -500,
      capacityDelta: 20,
      violations: ["curfew exceeds 23:00 limit", "cleaning fee unitemised"],
      counterStrategy: "Offer 4500 EUR flat with midnight extension included",
      draftCounterProposal: "We would like to counter propose 4500 EUR...",
      actedBy: "negotiator",
    };
    const result = v.safeParse(auditResultSchema, valid);
    assert.equal(result.success, true);
  });

  it("rejects audit result missing required fields", () => {
    const missing = {
      budgetDelta: -500,
      capacityDelta: 20,
    };
    const result = v.safeParse(auditResultSchema, missing);
    assert.equal(result.success, false);
  });
});

describe("Agent attribution schema", () => {
  it("accepts valid attribution with tokens breakdown", () => {
    const valid = {
      agent: "negotiator",
      verb: "revised",
      model: "gemini-1.5-pro",
      latencyMs: 1420,
      tokens: {
        prompt: 1024,
        completion: 256,
        total: 1280,
      },
      viaRelay: true,
    };
    const result = v.safeParse(agentAttributionSchema, valid);
    assert.equal(result.success, true);
  });

  it("rejects attribution with unknown agent", () => {
    const invalid = {
      agent: "unknown-bot",
      verb: "analyzed",
    };
    const result = v.safeParse(agentAttributionSchema, invalid);
    assert.equal(result.success, false);
  });
});

describe("Activity event schema", () => {
  it("accepts valid activity event", () => {
    const valid = {
      id: VALID_UUID_1,
      at: "2026-11-03T12:00:00.000Z",
      actor: "negotiator",
      message: "Generated initial audit against specs",
      attribution: {
        agent: "negotiator",
        verb: "audited",
      },
    };
    const result = v.safeParse(activityEventSchema, valid);
    assert.equal(result.success, true);
  });

  it("rejects activity event with invalid actor", () => {
    const invalid = {
      id: VALID_UUID_1,
      at: 1793746384000,
      actor: "unknown-actor",
      message: "Something happened",
    };
    const result = v.safeParse(activityEventSchema, invalid);
    assert.equal(result.success, false);
  });
});

describe("Event specs schema", () => {
  it("accepts valid event specs", () => {
    const valid = {
      eventName: "Annual Gala 2026",
      targetDate: "2026-12-15",
      guestCount: 250,
      maxBudget: 20000,
      requiredCurfew: "01:00",
      avRequired: true,
    };
    const result = v.safeParse(eventSpecsSchema, valid);
    assert.equal(result.success, true);
  });

  it("rejects event specs with negative guest count", () => {
    const invalid = {
      eventName: "Annual Gala 2026",
      targetDate: "2026-12-15",
      guestCount: -5,
      maxBudget: 20000,
    };
    const result = v.safeParse(eventSpecsSchema, invalid);
    assert.equal(result.success, false);
  });
});

describe("Negotiation row schema (per-venue granularity)", () => {
  it("accepts a fully populated negotiation row", () => {
    const row = {
      id: VALID_UUID_1,
      entityId: VALID_UUID_2,
      projectId: VALID_UUID_3,
      name: "Grand Ballroom",
      status: "requires_approval",
      rawText: "Offer: 5000 EUR for Saturday evening.",
      quotedCost: 5000,
      quotedCapacity: 300,
      quotedCurfew: "23:30",
      avIncluded: true,
      audit: {
        budgetDelta: 200,
        capacityDelta: 0,
        violations: ["cost slightly above target"],
        counterStrategy: "Ask for 10 percent discount",
        draftCounterProposal: "Would 4500 EUR be acceptable?",
        actedBy: "negotiator",
      },
      approvedBy: "client",
      actedBy: "negotiator",
      feedback: [
        {
          id: VALID_UUID_4,
          at: "2026-11-03T12:00:00.000Z",
          by: "client",
          kind: "comment",
          text: "Can we confirm AV is included?",
        },
      ],
      revision: 1,
      createdAt: "2026-11-03T10:00:00.000Z",
      updatedAt: "2026-11-03T12:00:00.000Z",
    };

    const result = v.safeParse(negotiationRowSchema, row);
    assert.equal(result.success, true);
    // negotiationSchema has identical shape
    const aliasResult = v.safeParse(negotiationSchema, row);
    assert.equal(aliasResult.success, true);
  });

  it("accepts minimal negotiation row", () => {
    const minimal = {
      id: VALID_UUID_1,
      entityId: VALID_UUID_2,
      projectId: VALID_UUID_3,
      name: "Minimal Hall",
      status: "pending_audit",
      createdAt: 1793746384000,
      updatedAt: 1793746384000,
    };
    const result = v.safeParse(negotiationRowSchema, minimal);
    assert.equal(result.success, true);
  });

  it("rejects negotiation row with non-uuid entityId", () => {
    const invalid = {
      id: VALID_UUID_1,
      entityId: INVALID_UUID,
      projectId: VALID_UUID_3,
      name: "Hall",
      status: "pending_audit",
      createdAt: 1793746384000,
      updatedAt: 1793746384000,
    };
    const result = v.safeParse(negotiationRowSchema, invalid);
    assert.equal(result.success, false);
  });

  it("createNegotiationSchema omits id and timestamps", () => {
    const createPayload = {
      entityId: VALID_UUID_2,
      projectId: VALID_UUID_3,
      name: "New Venue Deal",
      status: "pending_audit",
      quotedCost: 3000,
    };
    const result = v.safeParse(createNegotiationSchema, createPayload);
    assert.equal(result.success, true);
  });

  it("updateNegotiationSchema accepts partial updates", () => {
    const updatePayload = {
      status: "counter_proposed",
      revision: 2,
    };
    const result = v.safeParse(updateNegotiationSchema, updatePayload);
    assert.equal(result.success, true);
  });
});

describe("RoomIncoming wire protocol union", () => {
  it("discriminates approve message", () => {
    const payload = {
      type: "approve",
      proposalId: VALID_UUID_1,
    };
    const result = v.safeParse(roomIncomingSchema, payload);
    assert.equal(result.success, true);
    if (result.success && result.output.type === "approve") {
      assert.equal(result.output.type, "approve");
      assert.equal(result.output.proposalId, VALID_UUID_1);
    }
  });

  it("rejects approve message with bad proposalId", () => {
    const payload = {
      type: "approve",
      proposalId: INVALID_UUID,
    };
    const result = v.safeParse(roomIncomingSchema, payload);
    assert.equal(result.success, false);
  });

  it("discriminates reject message with optional reason", () => {
    const payloadWithReason = {
      type: "reject",
      proposalId: VALID_UUID_1,
      reason: "Curfew too early",
    };
    const res1 = v.safeParse(roomIncomingSchema, payloadWithReason);
    assert.equal(res1.success, true);

    const payloadWithoutReason = {
      type: "reject",
      proposalId: VALID_UUID_1,
    };
    const res2 = v.safeParse(roomIncomingSchema, payloadWithoutReason);
    assert.equal(res2.success, true);
  });

  it("discriminates comment message", () => {
    const payload = {
      type: "comment",
      proposalId: VALID_UUID_1,
      text: "Negotiate payment terms to net 30.",
    };
    const result = v.safeParse(roomIncomingSchema, payload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.output.type, "comment");
    }
  });

  it("rejects comment message with empty text", () => {
    const payload = {
      type: "comment",
      proposalId: VALID_UUID_1,
      text: "",
    };
    const result = v.safeParse(roomIncomingSchema, payload);
    assert.equal(result.success, false);
  });

  it("discriminates ping message", () => {
    const ping1 = { type: "ping" };
    const res1 = v.safeParse(roomIncomingSchema, ping1);
    assert.equal(res1.success, true);

    const ping2 = { type: "ping", timestamp: 1793746384000 };
    const res2 = v.safeParse(roomIncomingSchema, ping2);
    assert.equal(res2.success, true);
  });

  it("rejects unknown incoming message type", () => {
    const bad = {
      type: "unknown_incoming",
      proposalId: VALID_UUID_1,
    };
    const result = v.safeParse(roomIncomingSchema, bad);
    assert.equal(result.success, false);
  });

  it("rejects incoming message missing type", () => {
    const bad = {
      proposalId: VALID_UUID_1,
    };
    const result = v.safeParse(roomIncomingSchema, bad);
    assert.equal(result.success, false);
  });
});

describe("RoomOutgoing wire protocol union", () => {
  it("discriminates toast message", () => {
    const toast = {
      type: "toast",
      message: "Client approved counter proposal",
    };
    const result = v.safeParse(roomOutgoingSchema, toast);
    assert.equal(result.success, true);
    if (result.success && result.output.type === "toast") {
      assert.equal(result.output.type, "toast");
      assert.equal(result.output.message, "Client approved counter proposal");
    }
  });

  it("rejects toast missing message", () => {
    const toast = { type: "toast" };
    const result = v.safeParse(roomOutgoingSchema, toast);
    assert.equal(result.success, false);
  });

  it("discriminates snapshot message", () => {
    const snapshot = {
      type: "snapshot",
      snapshot: {
        specs: {
          eventName: "Tech Summit 2026",
          targetDate: "2026-12-01",
          guestCount: 200,
          maxBudget: 15000,
          requiredCurfew: "23:00",
          avRequired: true,
        },
        negotiations: [],
        activity: [],
      },
    };
    const result = v.safeParse(roomOutgoingSchema, snapshot);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.output.type, "snapshot");
    }
  });

  it("discriminates pong message", () => {
    const pong = { type: "pong", timestamp: 1793746384000 };
    const result = v.safeParse(roomOutgoingSchema, pong);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.output.type, "pong");
    }
  });

  it("rejects unknown outgoing message type", () => {
    const bad = { type: "unrecognized", message: "nope" };
    const result = v.safeParse(roomOutgoingSchema, bad);
    assert.equal(result.success, false);
  });
});

describe("Room snapshot and metadata schemas", () => {
  it("validates room socket metadata", () => {
    assert.equal(v.safeParse(roomSocketMetadataSchema, { role: "client" }).success, true);
    assert.equal(v.safeParse(roomSocketMetadataSchema, { role: "invalid" }).success, false);
  });

  it("validates empty or populated room snapshot", () => {
    assert.equal(v.safeParse(roomSnapshotSchema, {}).success, true);
    assert.equal(
      v.safeParse(roomSnapshotSchema, {
        specs: null,
        negotiations: [],
        activity: [],
      }).success,
      true,
    );
  });
});
