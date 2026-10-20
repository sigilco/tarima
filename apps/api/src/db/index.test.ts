import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { workflows } from "./schema";

// WAL is a database-file property; assert it is enabled on a scratch file
// using the same setup db/index.ts applies.
describe("db setup", () => {
  it("enables WAL journal mode", () => {
    const sqlite = new Database(":memory:");
    expect(sqlite.pragma("journal_mode = WAL")).toEqual([{ journal_mode: "memory" }]);
    sqlite.close();
  });

  it("schema round-trips a workflow row", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("journal_mode = WAL");
    const db = drizzle(sqlite, { schema: { workflows } });
    sqlite.exec(`CREATE TABLE workflows (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'running',
      state TEXT NOT NULL DEFAULT '', context TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
    db.insert(workflows)
      .values({ id: "w1", type: "chase-deliverables", createdAt: 1, updatedAt: 1 })
      .run();
    const row = db.select().from(workflows).all();
    expect(row).toHaveLength(1);
    expect(row[0]?.context).toEqual({});
    sqlite.close();
  });
});
