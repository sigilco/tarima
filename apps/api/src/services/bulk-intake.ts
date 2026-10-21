/**
 * Bulk CSV intake service (Stage 5, T5.2).
 *
 * The board UI needs the machine intake behind the session cookie. The
 * logic lives here, in one place, so the surface that owns it (the
 * session ui route) and any future caller behave identically: parse,
 * insert, audit, notify the chats bound to the project.
 *
 * The Bearer surface (`routes/csv.ts`) carries the same behaviour inline
 * and is owned by another stream, so it is not rewired here; the two
 * copies collapse when that stream merges.
 *
 * The parsing itself is shared: `services/csv-intake.ts` owns the tolerant
 * CSV reader (papaparse), this module owns what happens to the rows.
 */
import { randomUUID } from "node:crypto";
import { db } from "../db";
import { events } from "../db/schema";
import { parseEntitiesCsvDetailed } from "./csv-intake";
import { createEntity, type EntityWire } from "./entities";
import { pushDigest } from "../telegram";

/** One rejected row, as reported back to the caller. */
interface IntakeRowError {
  row: number;
  message: string;
}

/** The outcome of an intake call. */
export interface BulkIntakeResult {
  created: number;
  entities: EntityWire[];
  errors: IntakeRowError[];
  /** True when the document could not be read as a CSV of entities at all. */
  fatal: boolean;
}

/**
 * Insert the entities of a CSV document into a project.
 *
 * A document that cannot be read as a CSV of entities at all is a client
 * error (`fatal`); a document with a few bad rows still lands, with the
 * failures reported per row.
 *
 * The rows are created through the entity service, so an intake row lands
 * with the same wire shape as a row created through the REST surface.
 */
export async function handleBulkIntake(
  projectId: string,
  csv: string,
  actor: string,
): Promise<BulkIntakeResult> {
  const { entities: rows, errors, fatal } = parseEntitiesCsvDetailed(csv);
  if (fatal) return { created: 0, entities: [], errors, fatal: true };

  // One millisecond per row, so the board keeps the order of the
  // document instead of the order of the random uuids.
  const now = Date.now();
  const created = rows.map((row, index) =>
    createEntity(db, {
      projectId,
      name: row.name,
      ...(row.contact ? { contact: row.contact } : {}),
      status: "intake",
      missing: row.missing,
      createdAt: now + index,
    }),
  );

  db.insert(events)
    .values({
      id: randomUUID(),
      actor,
      type: "entities.bulk_intake",
      subjectType: "project",
      subjectId: projectId,
      data: { created: created.length, failed: errors.length },
    })
    .run();

  // The board changed, so the chats bound to this project get the new
  // digest. A push failure must not fail the intake.
  if (created.length > 0) {
    pushDigest(projectId).catch((err) => console.error("[telegram] digest push failed", err));
  }

  return { created: created.length, entities: created, errors, fatal: false };
}
