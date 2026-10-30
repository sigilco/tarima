/**
 * Server-sent events for the board (Stage 5, T5.2).
 *
 * GET /api/ui/projects/:projectId/events  -> text/event-stream
 *
 * AUTH: the session cookie (`tarima_session`), same as the rest of the UI
 * surface. The route is NOT behind the Bearer middleware: the browser's
 * EventSource cannot attach an Authorization header, and the cookie is the
 * only credential a browser has. The route therefore uses the session
 * middleware directly, and the project id in the path is the only scope.
 *
 * WHAT IT STREAMS: the durable audit trail (`events` table) plus synthetic
 * `entity.changed` signals, polled every `POLL_INTERVAL_MS`. See
 * `lib/events.ts` for why the stream is a poll of the table rather than an
 * in-process bus: the writers of those rows (the engine dispatcher, the
 * inbound webhooks) are owned by another stream, so this route reads what
 * they already persist instead of asking them to publish.
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
import { requireSession, getSessionUser } from "../middleware/require-session";
import { getProject } from "../services/projects";
import { advanceCursor, cursorNow, pollBoardEvents } from "../lib/events";

/** How often the audit table is polled, in ms. */
const POLL_INTERVAL_MS = 2_000;

/** How often a heartbeat comment is written, in ms. */
const HEARTBEAT_MS = 25_000;

export const eventRoutes = new Hono().get(
  "/api/ui/projects/:projectId/events",
  requireSession(),
  (c) => {
    const projectId = c.req.param("projectId");
    const ownerId = getSessionUser(c)?.userId ?? null;
    if (!getProject(db, projectId, ownerId)) return c.json({ error: "not_found" }, 404);

    return streamSSE(c, async (stream) => {
      // The stream starts at "now": only changes that happen while the
      // board is open are delivered.
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
