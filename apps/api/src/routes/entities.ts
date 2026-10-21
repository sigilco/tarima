/**
 * Entity routes, protected with the Bearer API key middleware.
 *
 * Scopes:
 *   entities:read  -> read one entity
 *   entities:write -> patch one entity
 *
 * Bodies are validated with the valibot schemas from `@tarima/contract`.
 * The server owns `id`, `projectId`, `createdAt` and `updatedAt`, so
 * those keys are stripped from the accepted body: `projectId` comes
 * from the path on create, and the timestamps are always written by
 * the api. A validation failure is 400 `{error:"invalid_request"}`, an
 * unknown id is 404 `{error:"not_found"}`.
 */
import { Hono } from "hono";
import * as v from "valibot";
import { updateEntitySchema } from "@tarima/contract";
import { db } from "../db";
import { requireApiKey } from "../middleware/require-api-key";
import { getEntity, updateEntity } from "../services/entities";

/** The accepted patch body: the contract's update shape minus the server-owned timestamp. */
const patchSchema = v.omit(updateEntitySchema, ["updatedAt"]);

export const entityRoutes = new Hono()
  .use("/api/entities/*", requireApiKey(["entities:read", "entities:write"]))
  .get("/api/entities/:entityId", requireApiKey(["entities:read"]), (c) => {
    const entity = getEntity(db, c.req.param("entityId"));
    if (!entity) return c.json({ error: "not_found" }, 404);
    return c.json({ entity });
  })
  .patch("/api/entities/:entityId", requireApiKey(["entities:write"]), async (c) => {
    const parsed = v.safeParse(patchSchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const entity = updateEntity(db, c.req.param("entityId"), parsed.output);
    if (!entity) return c.json({ error: "not_found" }, 404);
    return c.json({ entity });
  });
