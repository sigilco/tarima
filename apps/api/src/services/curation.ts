/**
 * Curation service: match a confirmed brief against the venue catalog
 * and create candidate rows for the shortlist gate.
 *
 * The venue_catalog table is the cache (stream F owns the provider
 * chain that fills it). Curation v0 is deterministic:
 *   - same city (case-insensitive; the catalog stores display names)
 *   - capacity fits the headcount when both sides are known
 *   - price band is not filtered on: the research docs carry no
 *     measured prices, so a budget filter would silently empty every
 *     city. Band data arrives with the provider chain.
 *
 * Catalog miss: when no catalog row matches the city the provider
 * chain would enrich it (stream F). Until that lands the miss is
 * reported honestly: zero candidates, stage stays `curating`, and the
 * user can add rows by CSV in the meantime. The seam is this function
 * only, so wiring the chain later is a one-function change.
 */
import { and, eq, sql } from "drizzle-orm";
import { BRIEF_GOAL_KEY, type Brief } from "@tarima/contract";
import { db } from "../db";
import { entities, projects, venueCatalog } from "../db/schema";
import { createEntity } from "./entities";

/** Cities the catalog knows under several spellings. */
function normalizeCity(value: string): string {
  return value.trim().toLowerCase();
}

export interface CurateOutcome {
  /** Candidate rows created (`candidate` status). */
  candidates: number;
  /** Catalog rows considered in the city. */
  considered: number;
}

/**
 * Run curation for a project. Reads the stored brief, matches the
 * catalog and inserts one `candidate` entity per matching venue. Rows
 * already created by an earlier curation pass of the same project are
 * left alone (matching is by venue name in the entity's goal bag), so
 * calling this twice does not duplicate rows.
 */
export function curateProject(projectId: string): CurateOutcome {
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) throw new Error(`unknown project: ${projectId}`);

  const brief = (project.goal ?? {})[BRIEF_GOAL_KEY] as Brief | undefined;
  if (!brief) throw new Error(`project ${projectId} has no confirmed brief`);

  const city = normalizeCity(brief.city);
  const rows = db
    .select()
    .from(venueCatalog)
    .where(sql`lower(${venueCatalog.city}) = ${city}`)
    .all();

  const existing = db
    .select({ name: entities.name })
    .from(entities)
    .where(and(eq(entities.projectId, projectId), eq(entities.status, "candidate")))
    .all();
  const known = new Set(existing.map((row) => row.name));

  let created = 0;
  for (const venue of rows) {
    if (known.has(venue.name)) continue;
    // Capacity fit: only enforced when the catalog row carries a number.
    if (venue.capacity !== null && venue.capacity < brief.headcount * 0.8) continue;
    const entity = createEntity(db, {
      projectId,
      name: venue.name,
      status: "candidate",
      missing: [],
    });
    // The venue facts ride on the entity's result bag (not the goal bag
    // the wire reads), so the board renders candidates without a schema
    // change while keeping the provenance queryable.
    db.update(entities)
      .set({
        result: {
          venue: {
            id: venue.id,
            city: venue.city,
            area: venue.area,
            capacity: venue.capacity,
            priceBand: venue.priceBand,
            source: venue.source,
            url: venue.url,
          },
        },
      })
      .where(eq(entities.id, entity.id))
      .run();
    created++;
  }

  return { candidates: created, considered: rows.length };
}
