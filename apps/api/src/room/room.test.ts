import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import * as v from "valibot";
import {
  roomOutgoingSnapshotSchema,
  type NegotiationRow,
  type RoomOutgoing,
} from "@tarima/contract";
import { createSnapshotMessage, reduceRoomState, type ProjectRoomState } from "./state";
import {
  getOrCreateRoom,
  handleRoomConnection,
  resetRoomsForTest,
  sendProposalCounter,
  type ConnectedSocket,
} from "./server";

function createMockSocket(role: "organizer" | "observer" = "organizer"): {
  socket: ConnectedSocket;
  sent: RoomOutgoing[];
} {
  const sent: RoomOutgoing[] = [];
  const socket: ConnectedSocket = {
    role,
    isObserver: role === "observer",
    send: (data: string) => {
      sent.push(JSON.parse(data));
    },
    close: vi.fn(),
  };
  return { socket, sent };
}

describe("Negotiation Room Server & State Machine", () => {
  const projectId = randomUUID();
  const negotiationId = randomUUID();
  const entityId = randomUUID();

  function makeSampleState(): ProjectRoomState {
    const neg: NegotiationRow = {
      id: negotiationId,
      entityId,
      projectId,
      name: "The Glasshouse",
      status: "requires_approval",
      quotedCost: 16000,
      quotedCapacity: 150,
      quotedCurfew: "00:00",
      avIncluded: true,
      rawText: "Sample quote for venue rental",
      audit: {
        budgetDelta: 1000,
        capacityDelta: 0,
        violations: ["cost slightly exceeds budget"],
        counterStrategy: "Offer 15000 EUR with AV included",
        draftCounterProposal: "We would like to propose 15000 EUR inclusive of AV.",
        actedBy: "system",
      },
      feedback: [],
      revision: 1,
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 5000,
    };

    return {
      projectId,
      specs: {
        eventName: "Annual Summit 2026",
        targetDate: "2026-12-15",
        guestCount: 150,
        maxBudget: 15000,
        requiredCurfew: "23:30",
        avRequired: true,
      },
      negotiations: [neg],
      activity: [
        {
          id: randomUUID(),
          at: Date.now() - 20000,
          actor: "system",
          message: "Proposal received from The Glasshouse",
          actedBy: "system",
        },
      ],
    };
  }

  beforeEach(() => {
    resetRoomsForTest();
  });

  describe("Pure Reducer & Access Rules", () => {
    it("observer cannot approve, comment, or reject", () => {
      const state = makeSampleState();

      // Observer approve
      const approveRes = reduceRoomState(
        state,
        { type: "approve", proposalId: negotiationId },
        "observer",
      );
      expect(approveRes.broadcast).toBe(false);
      expect(approveRes.effects).toHaveLength(0);
      expect(approveRes.outgoing?.type).toBe("toast");
      expect((approveRes.outgoing as any)?.message).toContain("Observers are read-only");
      expect(approveRes.nextState.negotiations[0]!.status).toBe("requires_approval");

      // Observer comment
      const commentRes = reduceRoomState(
        state,
        { type: "comment", proposalId: negotiationId, text: "Can we get a discount?" },
        "observer",
      );
      expect(commentRes.broadcast).toBe(false);
      expect(commentRes.outgoing?.type).toBe("toast");
      expect((commentRes.outgoing as any)?.message).toContain("Observers are read-only");
      expect(commentRes.nextState.negotiations[0]!.feedback).toHaveLength(0);

      // Observer reject
      const rejectRes = reduceRoomState(
        state,
        { type: "reject", proposalId: negotiationId, reason: "Too expensive" },
        "observer",
      );
      expect(rejectRes.broadcast).toBe(false);
      expect(rejectRes.outgoing?.type).toBe("toast");
      expect((rejectRes.outgoing as any)?.message).toContain("Observers are read-only");
      expect(rejectRes.nextState.negotiations[0]!.status).toBe("requires_approval");
    });

    it("ping answers with pong without broadcasting", () => {
      const state = makeSampleState();
      const res = reduceRoomState(state, { type: "ping", timestamp: 123456 }, "organizer");
      expect(res.broadcast).toBe(false);
      expect(res.effects).toHaveLength(0);
      expect(res.outgoing).toEqual({ type: "pong", timestamp: 123456 });
    });

    it("organizer approve stages counter and transitions to counter_proposed", () => {
      const state = makeSampleState();
      const res = reduceRoomState(
        state,
        { type: "approve", proposalId: negotiationId },
        "organizer",
      );

      expect(res.broadcast).toBe(true);
      expect(res.nextState.negotiations[0]!.status).toBe("counter_proposed");
      expect(res.nextState.negotiations[0]!.approvedBy).toBe("organizer");
      expect(res.nextState.negotiations[0]!.revision).toBe(2);

      // Effects: proposal_version (stage counter) + decision (approve) + event
      expect(res.effects).toHaveLength(3);
      expect(res.effects[0]!.type).toBe("db_insert_proposal_version");
      expect(res.effects[1]!.type).toBe("db_insert_decision");
      expect(res.effects[2]!.type).toBe("db_insert_event");

      // Activity feed appended
      expect(res.nextState.activity[0]!.message).toContain("Approved counter proposal");
    });

    it("cannot approve negotiation in non-requires_approval status", () => {
      const state = makeSampleState();
      state.negotiations[0]!.status = "counter_proposed";

      const res = reduceRoomState(
        state,
        { type: "approve", proposalId: negotiationId },
        "organizer",
      );
      expect(res.broadcast).toBe(false);
      expect(res.outgoing?.type).toBe("toast");
      expect((res.outgoing as any)?.message).toContain("Cannot approve");
      expect(res.nextState.negotiations[0]!.status).toBe("counter_proposed");
    });

    it("organizer comment routes to revising and adds feedback", () => {
      const state = makeSampleState();
      const res = reduceRoomState(
        state,
        { type: "comment", proposalId: negotiationId, text: "Check curfew compliance" },
        "organizer",
      );

      expect(res.broadcast).toBe(true);
      expect(res.nextState.negotiations[0]!.status).toBe("revising");
      expect(res.nextState.negotiations[0]!.feedback).toHaveLength(1);
      expect(res.nextState.negotiations[0]!.feedback![0]!.text).toBe("Check curfew compliance");
      expect(res.nextState.negotiations[0]!.feedback![0]!.kind).toBe("comment");

      // Effects: decision + event
      expect(res.effects).toHaveLength(2);
      expect(res.effects[0]!.type).toBe("db_insert_decision");
      expect(res.effects[1]!.type).toBe("db_insert_event");
    });

    it("organizer reject transitions to rejected terminal status", () => {
      const state = makeSampleState();
      const res = reduceRoomState(
        state,
        { type: "reject", proposalId: negotiationId, reason: "Client declined venue" },
        "organizer",
      );

      expect(res.broadcast).toBe(true);
      expect(res.nextState.negotiations[0]!.status).toBe("rejected");
      expect(res.nextState.negotiations[0]!.feedback).toHaveLength(1);
      expect(res.nextState.negotiations[0]!.feedback![0]!.kind).toBe("reject");
      expect(res.nextState.negotiations[0]!.feedback![0]!.text).toBe("Client declined venue");
    });

    it("hard HITL gate: only counter_proposed can transition to sent on COUNTER_SENT", () => {
      const state = makeSampleState();

      // Attempt sent directly from requires_approval
      const invalidRes = reduceRoomState(
        state,
        { type: "counter_sent", proposalId: negotiationId },
        "organizer",
      );
      expect(invalidRes.broadcast).toBe(false);
      expect(invalidRes.outgoing?.type).toBe("toast");
      expect(invalidRes.nextState.negotiations[0]!.status).toBe("requires_approval");

      // Now set to counter_proposed and transition
      state.negotiations[0]!.status = "counter_proposed";
      const validRes = reduceRoomState(
        state,
        { type: "counter_sent", proposalId: negotiationId },
        "organizer",
      );
      expect(validRes.broadcast).toBe(true);
      expect(validRes.nextState.negotiations[0]!.status).toBe("sent");
    });
  });

  describe("Socket Layer & Frame Validation", () => {
    it("sends initial snapshot on connection", () => {
      const room = getOrCreateRoom(projectId);
      room.state = makeSampleState();

      const { socket, sent } = createMockSocket("organizer");
      handleRoomConnection(projectId, socket);

      expect(sent).toHaveLength(1);
      expect(sent[0]!.type).toBe("snapshot");
      const check = v.safeParse(roomOutgoingSnapshotSchema, sent[0]);
      expect(check.success).toBe(true);
    });

    it("rejects malformed JSON with a toast frame", () => {
      const room = getOrCreateRoom(projectId);
      room.state = makeSampleState();

      const { socket, sent } = createMockSocket("organizer");
      const { onMessage } = handleRoomConnection(projectId, socket);

      onMessage("not a valid json string {");
      expect(sent).toHaveLength(2); // [0] = initial snapshot, [1] = toast
      expect(sent[1]!.type).toBe("toast");
      expect((sent[1] as any).message).toBe("Invalid JSON frame");
    });

    it("rejects schema-invalid frames with a toast frame", () => {
      const room = getOrCreateRoom(projectId);
      room.state = makeSampleState();

      const { socket, sent } = createMockSocket("organizer");
      const { onMessage } = handleRoomConnection(projectId, socket);

      // Missing proposalId on approve
      onMessage(JSON.stringify({ type: "approve" }));
      expect(sent).toHaveLength(2);
      expect(sent[1]!.type).toBe("toast");
      expect((sent[1] as any).message).toBe("Invalid message frame");

      // Unknown type
      onMessage(JSON.stringify({ type: "hack_everything" }));
      expect(sent).toHaveLength(3);
      expect(sent[2]!.type).toBe("toast");
      expect((sent[2] as any).message).toBe("Invalid message frame");
    });

    it("broadcasts snapshot to all connected clients on state mutation", () => {
      const room = getOrCreateRoom(projectId);
      room.state = makeSampleState();

      const organizer = createMockSocket("organizer");
      const observer = createMockSocket("observer");

      const orgHandler = handleRoomConnection(projectId, organizer.socket);
      handleRoomConnection(projectId, observer.socket);

      // Both receive initial snapshot
      expect(organizer.sent).toHaveLength(1);
      expect(observer.sent).toHaveLength(1);

      // Organizer approves
      orgHandler.onMessage(JSON.stringify({ type: "approve", proposalId: negotiationId }));

      // Both sockets receive broadcast snapshot with new status counter_proposed
      expect(organizer.sent).toHaveLength(2);
      expect(observer.sent).toHaveLength(2);

      const orgSnap = organizer.sent[1] as any;
      const obsSnap = observer.sent[1] as any;

      expect(orgSnap.type).toBe("snapshot");
      expect(obsSnap.type).toBe("snapshot");
      expect(orgSnap.snapshot.negotiations[0].status).toBe("counter_proposed");
      expect(obsSnap.snapshot.negotiations[0].status).toBe("counter_proposed");
    });

    it("REST sendProposalCounter gates status and broadcasts to room", () => {
      const room = getOrCreateRoom(projectId);
      room.state = makeSampleState();

      // First approve so it is in counter_proposed
      room.state.negotiations[0]!.status = "counter_proposed";

      const client = createMockSocket("observer");
      handleRoomConnection(projectId, client.socket);
      expect(client.sent).toHaveLength(1); // initial snapshot

      // Attempt send as observer actor
      const denied = sendProposalCounter(projectId, negotiationId, {
        kind: "share-token",
        token: "tok",
        projectId,
        roomId: null,
        role: "observer",
      });
      expect(denied.ok).toBe(false);
      expect((denied as any).status).toBe(401);

      // Send as session owner actor
      const allowed = sendProposalCounter(projectId, negotiationId, {
        kind: "session",
        userId: "user-123",
        role: "owner",
      });
      expect(allowed.ok).toBe(true);
      expect((allowed as any).negotiation.status).toBe("sent");

      // Client socket received broadcast snapshot with status sent
      expect(client.sent).toHaveLength(2);
      const broadcastSnap = client.sent[1] as any;
      expect(broadcastSnap.snapshot.negotiations[0].status).toBe("sent");
    });
  });

  describe("Snapshot compliance", () => {
    it("createSnapshotMessage satisfies roomOutgoingSnapshotSchema", () => {
      const state = makeSampleState();
      const msg = createSnapshotMessage(state);
      const parseResult = v.safeParse(roomOutgoingSnapshotSchema, msg);
      expect(parseResult.success).toBe(true);
    });
  });
});
