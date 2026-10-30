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
import { enrichVenue, searchVenues, venueSearchDeps } from "./venue-search";

/** Cities the catalog knows under several spellings. */
function normalizeCity(value: string): string {
  return value.trim().toLowerCase();
}

export interface CurateOutcome {
  /** Candidate rows created (`candidate` status). */
  candidates: number;
  /** Catalog rows considered in the city. */
  considered: number;
  /** Candidate rows created without a contact (the "no contact" bucket). */
  noContact: number;
}

/**
 * Run the provider chain for a city and category, when it is wired.
 * Errors are swallowed (a warn is logged): curation is cache-first and
 * a provider outage must not fail the stage move.
 */
async function runProviderSearch(city: string, category: string): Promise<void> {
  const deps = venueSearchDeps();
  if (!deps) return;
  try {
    const result = await searchVenues(db, { city, category }, deps);
    if (result.cache === "miss") {
      console.log(
        `[curation] venue search filled ${result.rows.length} catalog rows for ${city}/${category}`,
      );
    }
    // Lazy enrichment: one Overpass pass per venue that has never been
    // enriched. Sequential on purpose, the public instance is fragile.
    for (const row of result.rows) {
      if (row.enrichedAt !== null) continue;
      await enrichVenue(db, row.id, deps);
    }
  } catch (err) {
    console.warn("[curation] venue search failed:", err instanceof Error ? err.message : err);
  }
}

/**
 * Run curation for a project. Reads the stored brief, matches the
 * catalog and inserts one `candidate` entity per matching venue. Rows
 * already created by an earlier curation pass of the same project are
 * left alone (matching is by venue name in the entity's goal bag), so
 * calling this twice does not duplicate rows.
 */
export async function curateProject(
  projectId: string,
  options: { category?: string } = {},
): Promise<CurateOutcome> {
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) throw new Error(`unknown project: ${projectId}`);

  const brief = (project.goal ?? {})[BRIEF_GOAL_KEY] as Brief | undefined;
  if (!brief) throw new Error(`project ${projectId} has no confirmed brief`);

  const city = normalizeCity(brief.city);
  // Provider chain first (stream F): a catalog miss is now a live
  // search that persists everything it finds, so the query below reads
  // a fuller catalog. The seeded rows stay untouched.
  if (
    db
      .select()
      .from(venueCatalog)
      .where(sql`lower(${venueCatalog.city}) = ${city}`)
      .all().length === 0
  ) {
    await runProviderSearch(city, options.category ?? "bar");
  }
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
  let noContact = 0;
  for (const venue of rows) {
    if (known.has(venue.name)) continue;
    // Capacity fit: only enforced when the catalog row carries a number.
    if (venue.capacity !== null && venue.capacity < brief.headcount * 0.8) continue;
    // The contact rides on the row: a venue OSM knows an address for is
    // chaseable, one without it is a candidate the user has to fill.
    const contact = venue.contactEmail ?? undefined;
    if (!contact) noContact++;
    const entity = createEntity(db, {
      projectId,
      name: venue.name,
      ...(contact ? { contact } : {}),
      status: "candidate",
      // A row without a contact is flagged, not hidden: the board shows
      // it in the "no contact" bucket so the user can fill it by hand.
      missing: contact ? [] : ["contact"],
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
            externalId: venue.externalId,
            contactEmail: venue.contactEmail,
            contactPhone: venue.contactPhone,
            website: venue.website,
            needsContact: !contact,
          },
        },
      })
      .where(eq(entities.id, entity.id))
      .run();
    created++;
  }

  return { candidates: created, considered: rows.length, noContact };
}
