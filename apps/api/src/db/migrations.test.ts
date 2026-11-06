import { readdirSync, readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time. This file's DATABASE_URL is
// the BOOTSTRAP_DDL side of the comparison below.
const dir = mkdtempSync(join(tmpdir(), "tarima-migrations-"));
process.env.DATABASE_URL = join(dir, "bootstrap.db");
process.env.NODE_ENV = "test";

const { BOOTSTRAP_DDL, rawDatabase } = await import("./index");

const MIGRATIONS_DIR = join(import.meta.dirname, "../../drizzle");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

type SchemaShape = Map<string, Set<string>>;

/** table name -> set of column names, from a live better-sqlite3 handle. */
function shapeOf(sqlite: Database.Database): SchemaShape {
  const tables = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all() as { name: string }[];
  const shape: SchemaShape = new Map();
  for (const { name } of tables) {
    const columns = sqlite.prepare(`PRAGMA table_info(\`${name}\`)`).all() as { name: string }[];
    shape.set(name, new Set(columns.map((c) => c.name)));
  }
  return shape;
}

/** Apply every apps/api/drizzle/*.sql in filename order to a fresh file. */
function applyMigrations(path: string): Database.Database {
  const sqlite = new Database(path);
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort();
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed) sqlite.exec(trimmed);
    }
  }
  return sqlite;
}

describe("drizzle migrations vs BOOTSTRAP_DDL", () => {
  it("produce the same tables and columns", () => {
    const migratedPath = join(dir, "migrated.db");
    const migrated = applyMigrations(migratedPath);
    const migratedShape = shapeOf(migrated);
    migrated.close();

    // The imported db module already ran BOOTSTRAP_DDL against DATABASE_URL.
    const bootstrapShape = shapeOf(rawDatabase());

    const onlyMigrated = [...migratedShape.keys()].filter((t) => !bootstrapShape.has(t));
    const onlyBootstrap = [...bootstrapShape.keys()].filter((t) => !migratedShape.has(t));
    expect(onlyMigrated, "tables only in migrations").toEqual([]);
    expect(onlyBootstrap, "tables only in BOOTSTRAP_DDL").toEqual([]);

    for (const [table, columns] of migratedShape) {
      const bootColumns = bootstrapShape.get(table);
      expect(bootColumns, `columns of ${table}`).toBeDefined();
      expect(
        [...columns].filter((c) => !bootColumns?.has(c)),
        `columns only in migrations for ${table}`,
      ).toEqual([]);
      expect(
        [...(bootColumns ?? [])].filter((c) => !columns.has(c)),
        `columns only in BOOTSTRAP_DDL for ${table}`,
      ).toEqual([]);
    }
  });
});
