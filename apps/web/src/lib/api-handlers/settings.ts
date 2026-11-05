/**
 * Settings and inbox handlers (`/api/ui/settings*`).
 * Ported from apps/api/src/routes/settings.ts, unchanged logic.
 */
import * as v from "valibot";
import { bindingChannelSchema } from "@tarima/contract";
import { db } from "@tarima/api/db";
import { createConnectCode } from "@tarima/api/services/connect-codes";
import { listBindings, unbindChannel } from "@tarima/api/services/bindings";
import { listMessages, markMessagesRead, unreadCount } from "@tarima/api/services/messages";
import { readJson, sessionUserId } from "./helpers";

const connectBodySchema = v.object({ channel: bindingChannelSchema });
const readBodySchema = v.object({ ids: v.optional(v.array(v.pipe(v.string(), v.uuid()))) });

/** GET /api/ui/settings */
export function handleUiSettings(request: Request): Response {
  const userId = sessionUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({
    bindings: listBindings(db, userId),
    unread: unreadCount(db, userId),
  });
}

/** POST /api/ui/settings/connect-code */
export async function handleUiConnectCode(request: Request): Promise<Response> {
  const userId = sessionUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = v.safeParse(connectBodySchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const created = createConnectCode(db, userId, parsed.output.channel);
  return Response.json(created, { status: 201 });
}

/** DELETE /api/ui/settings/bindings/:bindingId */
export function handleUiUnbind(request: Request, bindingId: string): Response {
  const userId = sessionUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  unbindChannel(db, userId, bindingId);
  return Response.json({ ok: true });
}

/** GET /api/ui/settings/messages */
export function handleUiMessages(request: Request): Response {
  const userId = sessionUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({
    messages: listMessages(db, userId),
    unread: unreadCount(db, userId),
  });
}

/** POST /api/ui/settings/messages/read */
export async function handleUiMessagesRead(request: Request): Promise<Response> {
  const userId = sessionUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = v.safeParse(readBodySchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  markMessagesRead(db, userId, parsed.output.ids);
  return Response.json({ unread: unreadCount(db, userId) });
}
