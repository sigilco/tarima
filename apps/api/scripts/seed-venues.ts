/**
 * Seed the venue catalog from the beta research docs:
 *   docs/venue_candidates_sf.md + docs/venue_candidates_malaga.md
 *
 * The catalog doubles as the curation cache (stream F's provider chain
 * upserts into the same table). Rows are idempotent on (city, name),
 * so re-running is a no-op.
 *
 *   pnpm -C apps/api seed-venues
 *   DATABASE_URL=path/to/tarima.db pnpm -C apps/api seed-venues
 */
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";
import { SF_VENUES, MALAGA_VENUES } from "./seed-venues.data";

const dbUrl = process.env.DATABASE_URL ?? "tarima.db";
const sqlite = new Database(dbUrl);
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite, { schema });

for (const venue of [...SF_VENUES, ...MALAGA_VENUES]) {
  db.insert(schema.venueCatalog)
    .values({
      id: randomUUID(),
      city: venue.city,
      name: venue.name,
      area: venue.area ?? null,
      capacity: venue.capacity ?? null,
      priceBand: venue.priceBand ?? null,
      source: venue.source,
      url: venue.url ?? null,
      createdAt: Date.now(),
    })
    .onConflictDoNothing()
    .run();
}

const count = db.select().from(schema.venueCatalog).all().length;
console.log(`venue_catalog seeded: ${count} rows (db: ${dbUrl})`);
