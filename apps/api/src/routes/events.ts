/**
 * Server-sent events for the board and negotiation room (Stage 5, T5.2).
 *
 * GET /api/ui/projects/:projectId/events  -> text/event-stream
 *
 * AUTH: accepts EITHER the session cookie (`tarima_session`) from the owner
 * OR a valid observer share token (`?share_token=<token>`).
 * The browser's EventSource cannot attach an Authorization header, but
 * EventSource URLs CAN carry query parameters.
 *
 * WHAT IT STREAMS: the durable audit trail (`events` table) plus synthetic
 * `entity.changed` signals, polled every `POLL_INTERVAL_MS`.
 *
 * PROTOCOL:
 *   - one `data: {json}\n\n` frame per event (named "board")
 *   - a `: heartbeat` comment every HEARTBEAT_MS so proxies keep the
 *     connection open
 *   - the loop ends when the client disconnects (the request aborts)
 */
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "../db";
import {
  getRoomActor,
  requireRoomAccess,
  type RoomAccessEnv,
} from "../middleware/require-room-access";
import { getProject } from "../services/projects";
import { advanceCursor, cursorNow, pollBoardEvents } from "../lib/events";

/** How often the audit table is polled, in ms. */
const POLL_INTERVAL_MS = 2_000;

/** How often a heartbeat comment is written, in ms. */
const HEARTBEAT_MS = 25_000;

export const eventRoutes = new Hono<RoomAccessEnv>().get(
  "/api/ui/projects/:projectId/events",
  requireRoomAccess({ mode: "read", allowObserver: true }),
  (c) => {
    const projectId = c.req.param("projectId");
    const actor = getRoomActor(c);
    if (!actor) return c.json({ error: "unauthorized" }, 401);

    const project = getProject(db, projectId);
    if (!project) return c.json({ error: "not_found" }, 404);

    return streamSSE(c, async (stream) => {
      // The stream starts at "now": only changes that happen while the
      // board/room is open are delivered.
      let cursor = cursorNow();
      let lastHeartbeat = Date.now();
      stream.onAbort(() => {
        stream.abort();
      });

      while (!stream.aborted && !stream.closed) {
        const delivered = pollBoardEvents(db, projectId, cursor);
        cursor = advanceCursor(cursor, delivered);

        for (const event of delivered) {
          if (stream.aborted || stream.closed) return;
          await stream.writeSSE({ event: "board", data: JSON.stringify(event) });
        }

        // A heartbeat keeps intermediaries from closing an idle stream.
        if (Date.now() - lastHeartbeat >= HEARTBEAT_MS) {
          lastHeartbeat = Date.now();
          await stream.write(": heartbeat\n\n");
        }

        await stream.sleep(POLL_INTERVAL_MS);
      }
    });
  },
);
