import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";
import { BOOTSTRAP_DDL } from "./index";

// The drizzle migration folder: meta/_journal.json plus the 0NNN_*.sql
// files it names. Migrations are the schema source of truth on deploy;
// BOOTSTRAP_DDL mirrors them for dev and tests.
const migrationsFolder = join(import.meta.dirname, "../../drizzle");

type Schema = Record<string, Record<string, string>>;

function introspect(sqlite: Database.Database): Schema {
  const tables = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'",
    )
    .all() as { name: string }[];
  const out: Schema = {};
  for (const { name } of tables) {
    const cols = sqlite.prepare(`PRAGMA table_info('${name}')`).all() as {
      name: string;
      type: string;
    }[];
    out[name] = Object.fromEntries(cols.map((c) => [c.name, c.type]));
  }
  return out;
}

// Fresh sqlite that both paths start from (same pragmas as db/index.ts).
function freshSqlite(): Database.Database {
  const sqlite = new Database(":memory:");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("journal_mode = WAL");
  return sqlite;
}

describe("migrations match BOOTSTRAP_DDL", () => {
  it("applies every migration to an empty DB without error", () => {
    const sqlite = freshSqlite();
    const db = drizzle(sqlite);
    expect(() => migrate(db, { migrationsFolder })).not.toThrow();
    const schema = introspect(sqlite);
    expect(Object.keys(schema).length).toBeGreaterThan(20);
    sqlite.close();
  });

  it("migration and BOOTSTRAP_DDL schemas have identical tables and columns", () => {
    const journal = JSON.parse(
      readFileSync(join(migrationsFolder, "meta/_journal.json"), "utf8"),
    ) as { entries: { tag: string }[] };
    expect(journal.entries.at(-1)?.tag).toBe("0014_gtm_contacts");

    const migrated = freshSqlite();
    migrate(drizzle(migrated), { migrationsFolder });
    const migrationSchema = introspect(migrated);

    const bootstrapped = freshSqlite();
    for (const statement of BOOTSTRAP_DDL) bootstrapped.exec(statement);
    const bootstrapSchema = introspect(bootstrapped);

    expect(Object.keys(migrationSchema).sort()).toEqual(Object.keys(bootstrapSchema).sort());
    for (const table of Object.keys(migrationSchema)) {
      expect(Object.entries(migrationSchema[table]!).sort(), `table ${table}`).toEqual(
        Object.entries(bootstrapSchema[table]!).sort(),
      );
    }
    migrated.close();
    bootstrapped.close();
  });

  it("the migration snapshot prevId chain is unbroken", () => {
    const metaDir = join(migrationsFolder, "meta");
    const journal = JSON.parse(readFileSync(join(metaDir, "_journal.json"), "utf8")) as {
      entries: { idx: number; tag: string }[];
    };
    expect(journal.entries.at(-1)?.tag).toBe("0014_gtm_contacts");
    let prevId: string | null = "00000000-0000-0000-0000-000000000000";
    for (const entry of journal.entries) {
      const snapshot = JSON.parse(
        readFileSync(join(metaDir, `${String(entry.idx).padStart(4, "0")}_snapshot.json`), "utf8"),
      ) as { id: string; prevId: string | null };
      expect(snapshot.prevId, `snapshot ${entry.tag}`).toBe(prevId);
      prevId = snapshot.id;
    }
    expect(existsSync(join(migrationsFolder, "0012_place_geo.sql"))).toBe(true);
    expect(existsSync(join(migrationsFolder, "0013_email_outreach.sql"))).toBe(true);
    expect(existsSync(join(migrationsFolder, "0014_gtm_contacts.sql"))).toBe(true);
    expect(readdirSync(migrationsFolder).filter((f) => f.endsWith(".sql"))).toHaveLength(
      journal.entries.length,
    );
  });
});
