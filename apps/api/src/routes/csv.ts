/**
 * CSV intake route (Stage 5, T5.3): paste or upload a CSV of entities
 * into a project in one call.
 *
 * POST /api/projects/:projectId/entities/bulk
 *   body: { "csv": "<csv text>" }
 *   200 { created, entities, errors }   even when some rows fail; the
 *                                       failures are reported per row
 *   400 { error: "invalid_request" }    the body is not parseable at all
 *   404 { error: "not_found" }          the project does not exist
 *
 * Accepted CSV: header `name,contact,missing`; `missing` is a
 * `;`-separated list. Rows are capped at 500 per call; a row beyond the
 * cap is dropped and reported in `errors`.
 *
 * Inserted entities carry the db status `intake` and come back mapped to
 * the wire vocabulary: `missing` lives in the entity `goal` bag and the
 * db status `intake` is spelled the same on the wire.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import * as v from "valibot";
import { audit } from "@tarima/obs";
import { db } from "../db";
import { entities, events, projects, type EntityStatus } from "../db/schema";
import { requireApiKey } from "../middleware/require-api-key";
import { parseEntitiesCsvDetailed } from "../services/csv-intake";
import { pushDigest } from "../telegram";

/** The status intake rows land in, in the db vocabulary. */
const INTAKE_STATUS: EntityStatus = "intake";

const bodySchema = v.object({
  csv: v.pipe(v.string(), v.maxLength(1_000_000)),
});

export const csvRoutes = new Hono().post(
  "/api/projects/:projectId/entities/bulk",
  requireApiKey(["entities:write"]),
  async (c) => {
    const projectId = c.req.param("projectId");
    const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
    if (!project) return c.json({ error: "not_found" }, 404);

    const parsedBody = v.safeParse(bodySchema, await c.req.json().catch(() => null));
    if (!parsedBody.success) return c.json({ error: "invalid_request" }, 400);

    const { entities: rows, errors, fatal } = parseEntitiesCsvDetailed(parsedBody.output.csv);
    // A document that cannot be read as a CSV of entities at all is a
    // client error; a document with a few bad rows is not.
    if (fatal) return c.json({ created: 0, entities: [], errors }, 400);

    const now = Date.now();
    const created = rows.map((row) => {
      const record: typeof entities.$inferSelect = {
        id: randomUUID(),
        projectId,
        name: row.name,
        contactEmail: row.contact ?? null,
        goal: { missing: row.missing },
        result: {},
        status: INTAKE_STATUS,
        createdAt: now,
        updatedAt: now,
      };
      db.insert(entities).values(record).run();
      return toWire(record);
    });

    db.insert(events)
      .values({
        id: randomUUID(),
        actor: "api",
        type: "entities.bulk_intake",
        subjectType: "project",
        subjectId: projectId,
        data: { created: created.length, failed: errors.length },
      })
      .run();

    audit("entities.bulk_intake", {
      userId: "api",
      target: `project:${projectId}`,
      extra: { created: created.length, failed: errors.length },
    });

    // The board changed, so the chats bound to this project get the new
    // digest. A push failure must not fail the intake.
    if (created.length > 0) {
      pushDigest(projectId).catch((err) => console.error("[telegram] digest push failed", err));
    }

    return c.json({ created: created.length, entities: created, errors });
  },
);

/** The wire shape of one created entity (contract `entitySchema`). */
interface EntityWire {
  id: string;
  projectId: string;
  name: string;
  contact?: string;
  status: string;
  missing: string[];
  createdAt: string;
  updatedAt: string;
}

/** A freshly inserted row, mapped to the wire vocabulary. */
function toWire(row: typeof entities.$inferSelect): EntityWire {
  const goal = (row.goal ?? {}) as { missing?: unknown };
  const missing = Array.isArray(goal.missing)
    ? goal.missing.filter((item): item is string => typeof item === "string")
    : [];
  const contact = row.contactEmail ?? undefined;
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    ...(contact ? { contact } : {}),
    // `intake` is spelled the same in the db and on the wire, so no
    // translation is needed on this path.
    status: row.status,
    missing,
    createdAt: new Date(row.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(row.updatedAt ?? Date.now()).toISOString(),
  };
}
