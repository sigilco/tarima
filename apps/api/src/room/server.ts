/**
 * In-memory WebSocket room server and session manager.
 *
 * Implements Phase 2 slice 3:
 * - Accepts WS connections per project.
 * - Enforces access permissions (session owner/organizer vs share-token observer).
 * - Validates frames using roomIncomingSchema from @tarima/contract.
 * - Dispatches actions through the SFM state reducer.
 * - Broadcasts snapshot frames (roomOutgoingSnapshotSchema) to all clients on changes.
 */
import * as v from "valibot";
import {
  roomIncomingSchema,
  type RoomIncoming,
  type RoomOutgoing,
  type RoomRole,
} from "@tarima/contract";
import { db } from "../db";
import type { RoomActor } from "../middleware/require-room-access";
import {
  createSnapshotMessage,
  executeRoomEffects,
  loadRoomStateFromDb,
  reduceRoomState,
  type ProjectRoomState,
} from "./state";

export interface ConnectedSocket {
  role: RoomRole;
  isObserver: boolean;
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
}

export interface RoomInstance {
  projectId: string;
  state: ProjectRoomState;
  clients: Set<ConnectedSocket>;
}

const activeRooms = new Map<string, RoomInstance>();

/** Get or initialize an in-memory room for a project. */
export function getOrCreateRoom(projectId: string): RoomInstance {
  let room = activeRooms.get(projectId);
  if (!room) {
    const initialState = loadRoomStateFromDb(db, projectId);
    room = {
      projectId,
      state: initialState,
      clients: new Set(),
    };
    activeRooms.set(projectId, room);
  }
  return room;
}

/** Reset in-memory rooms (useful in tests). */
export function resetRoomsForTest(): void {
  activeRooms.clear();
}

/** Send a typed outgoing frame to a socket client. */
export function sendFrame(client: ConnectedSocket, frame: RoomOutgoing): void {
  try {
    client.send(JSON.stringify(frame));
  } catch {
    // Socket send failure handled silently or logged
  }
}

/** Broadcast a typed frame to all connected clients in a project room. */
export function broadcastRoom(projectId: string, frame: RoomOutgoing): void {
  const room = activeRooms.get(projectId);
  if (!room) return;
  const serialized = JSON.stringify(frame);
  for (const client of room.clients) {
    try {
      client.send(serialized);
    } catch {
      // Ignore dead socket during broadcast
    }
  }
}

/** Broadcast current room snapshot to all connected clients. */
export function broadcastSnapshot(projectId: string): void {
  const room = activeRooms.get(projectId);
  if (!room) return;
  const snapshotFrame = createSnapshotMessage(room.state);
  broadcastRoom(projectId, snapshotFrame);
}

/**
 * Handle a new WebSocket connection to a project's room.
 */
export function handleRoomConnection(
  projectId: string,
  client: ConnectedSocket,
): {
  onMessage: (raw: string) => void;
  onClose: () => void;
} {
  const room = getOrCreateRoom(projectId);
  room.clients.add(client);

  // Send initial snapshot immediately upon connection
  sendFrame(client, createSnapshotMessage(room.state));

  function onMessage(raw: string) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      sendFrame(client, { type: "toast", message: "Invalid JSON frame" });
      return;
    }

    const parseResult = v.safeParse(roomIncomingSchema, parsedJson);
    if (!parseResult.success) {
      sendFrame(client, { type: "toast", message: "Invalid message frame" });
      return;
    }

    const incoming: RoomIncoming = parseResult.output;
    const result = reduceRoomState(room.state, incoming, client.role);

    // Apply DB persistence effects
    if (result.effects.length > 0) {
      executeRoomEffects(db, result.effects);
    }

    room.state = result.nextState;

    // Send direct response to client if present (e.g. pong, toast)
    if (result.outgoing) {
      sendFrame(client, result.outgoing);
    }

    // Broadcast snapshot to all sockets if state mutated
    if (result.broadcast) {
      broadcastSnapshot(projectId);
    }
  }

  function onClose() {
    room.clients.delete(client);
  }

  return { onMessage, onClose };
}

/**
 * REST endpoint handler: dispatch the staged counter proposal (HITL gate).
 * Only transitions counter_proposed -> sent.
 */
export function sendProposalCounter(
  projectId: string,
  negotiationId: string,
  actor: RoomActor,
): { ok: true; negotiation: unknown } | { ok: false; error: string; status: number } {
  if (actor.kind !== "session") {
    return { ok: false, error: "unauthorized", status: 401 };
  }

  const room = getOrCreateRoom(projectId);
  const neg = room.state.negotiations.find((n) => n.id === negotiationId);
  if (!neg) {
    return { ok: false, error: "negotiation_not_found", status: 404 };
  }

  if (neg.status !== "counter_proposed") {
    return {
      ok: false,
      error: `cannot_send_in_state_${neg.status}`,
      status: 409,
    };
  }

  const result = reduceRoomState(
    room.state,
    { type: "counter_sent", proposalId: negotiationId },
    "organizer",
  );

  if (result.effects.length > 0) {
    executeRoomEffects(db, result.effects);
  }

  room.state = result.nextState;

  if (result.broadcast) {
    broadcastSnapshot(projectId);
  }

  const updated = room.state.negotiations.find((n) => n.id === negotiationId);
  return { ok: true, negotiation: updated };
}
