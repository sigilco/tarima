/**
 * Settings and inbox routes (Stage B, channels stream).
 *
 * The settings page is where a tester connects a channel and reads the
 * notifications the agent sent them:
 *
 *   GET  /api/ui/settings                  -> { bindings, unread }
 *   POST /api/ui/settings/connect-code     { channel } -> { code, expiresAt }
 *   DELETE /api/ui/settings/bindings/:id   -> { ok }
 *   GET  /api/ui/settings/messages         -> { messages, unread }
 *   POST /api/ui/settings/messages/read    { ids? }  -> { unread }
 *
 * All of them need the session cookie (the same credential the board
 * uses), so the routes live under `/api/ui/*` and use the session
 * middleware.
 *
 * The connect code is the only secret in the flow: it is shown once,
 * expires after 15 minutes and is single use.
 */
import { Hono } from "hono";
import * as v from "valibot";
import { bindingChannelSchema } from "@tarima/contract";
import { db } from "../db";
import { requireSession, getSessionUser } from "../middleware/require-session";
import { createConnectCode } from "../services/connect-codes";
import { listBindings, unbindChannel } from "../services/bindings";
import { listMessages, markMessagesRead, unreadCount } from "../services/messages";

const connectBodySchema = v.object({ channel: bindingChannelSchema });
const readBodySchema = v.object({ ids: v.optional(v.array(v.pipe(v.string(), v.uuid()))) });

export const settingsRoutes = new Hono()
  .use("/api/ui/*", requireSession())
  .get("/api/ui/settings", (c) => {
    const userId = getSessionUser(c)!.userId;
    return c.json({
      bindings: listBindings(db, userId),
      unread: unreadCount(db, userId),
    });
  })
  .post("/api/ui/settings/connect-code", async (c) => {
    const userId = getSessionUser(c)!.userId;
    const parsed = v.safeParse(connectBodySchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const created = createConnectCode(db, userId, parsed.output.channel);
    return c.json(created, 201);
  })
  .delete("/api/ui/settings/bindings/:bindingId", (c) => {
    const userId = getSessionUser(c)!.userId;
    unbindChannel(db, userId, c.req.param("bindingId"));
    return c.json({ ok: true });
  })
  .get("/api/ui/settings/messages", (c) => {
    const userId = getSessionUser(c)!.userId;
    return c.json({
      messages: listMessages(db, userId),
      unread: unreadCount(db, userId),
    });
  })
  .post("/api/ui/settings/messages/read", async (c) => {
    const userId = getSessionUser(c)!.userId;
    const parsed = v.safeParse(readBodySchema, await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    markMessagesRead(db, userId, parsed.output.ids);
    return c.json({ unread: unreadCount(db, userId) });
  });
