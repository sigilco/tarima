// Seeds venue-catalog rows for Berkeley into the throwaway DB so the
// agent's list_venues tool has real tarima rows to answer from.
import Database from "better-sqlite3";

const dbPath = process.argv[2];
if (!dbPath) throw new Error("usage: node turn-seed-venues.mjs <db-path>");
const db = new Database(dbPath);

const columns = db
  .prepare("PRAGMA table_info(venue_catalog)")
  .all()
  .map((c) => c.name);
const id = () => crypto.randomUUID();
const now = Date.now();

const rows = [
  {
    id: id(),
    city: "Berkeley",
    name: "The Faculty Club",
    area: "UC Berkeley campus",
    capacity: 60,
    price_band: "mid",
    source: "seed",
    url: null,
    external_id: "seed-faculty-club",
    contact_email: "events@berkeleyfacultyclub.com",
    contact_phone: null,
    website: "https://www.berkeleyfacultyclub.com",
    enriched_at: null,
    created_at: now,
  },
  {
    id: id(),
    city: "Berkeley",
    name: "Cafe Strada",
    area: "Bancroft Way",
    capacity: 30,
    price_band: "low",
    source: "seed",
    url: null,
    external_id: "seed-cafe-strada",
    contact_email: null,
    contact_phone: "+15105495300",
    website: "https://cafestrada.example",
    enriched_at: null,
    created_at: now,
  },
];

for (const row of rows) {
  const cols = Object.keys(row).filter((k) => columns.includes(k));
  const placeholders = cols.map((k) => `:${k}`).join(",");
  db.prepare(`INSERT INTO venue_catalog (${cols.join(",")}) VALUES (${placeholders})`).run(row);
}
console.log(`[turn] seeded ${rows.length} venue_catalog rows`);
