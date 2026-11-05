// Seeds a sponsor entity (a food/catering sponsor) into the throwaway DB
// so the agent's send_email tool has a real tarima row to email.
import Database from "better-sqlite3";

const dbPath = process.argv[2];
const projectId = process.argv[3];
if (!dbPath || !projectId)
  throw new Error("usage: node approval-seed-sponsor.mjs <db-path> <project-id>");
const db = new Database(dbPath);

const columns = db
  .prepare("PRAGMA table_info(entities)")
  .all()
  .map((c) => c.name);

const row = {
  id: crypto.randomUUID(),
  project_id: projectId,
  name: "Farmhouse Kitchen (food sponsor)",
  contact_email: "catering@farmhouse-kitchen.test",
  goal: JSON.stringify({ kind: "food", city: "Berkeley, CA", asks: "catering quote for 20" }),
  result: "{}",
  status: "candidate",
  created_at: Date.now(),
  updated_at: Date.now(),
};

const cols = Object.keys(row).filter((k) => columns.includes(k));
const placeholders = cols.map((k) => `:${k}`).join(",");
db.prepare(`INSERT INTO entities (${cols.join(",")}) VALUES (${placeholders})`).run(row);
console.log(`[approval] seeded sponsor entity ${row.id} (catering@farmhouse-kitchen.test)`);
