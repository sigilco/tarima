/**
 * Settings handlers (`/api/ui/settings*`).
 * SP7 teardown: only the connect-code endpoint survives — the telegram
 * proof harness (apps/web/tests/turn/telegram-run.sh) mints a code to
 * bind a chat. The inbox and the unbind endpoint went away with the
 * legacy settings screen.
 */
import * as v from "valibot";
import { bindingChannelSchema } from "@tarima/contract";
import { db } from "@tarima/api/db";
import { createConnectCode } from "@tarima/api/services/connect-codes";
import { readJson, sessionUserId } from "./helpers";

const connectBodySchema = v.object({ channel: bindingChannelSchema });

/** POST /api/ui/settings/connect-code */
export async function handleUiConnectCode(request: Request): Promise<Response> {
  const userId = sessionUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = v.safeParse(connectBodySchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const created = createConnectCode(db, userId, parsed.output.channel);
  return Response.json(created, { status: 201 });
}
