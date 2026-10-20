import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@tarima/api/db/schema";

export type EngineDb = BetterSQLite3Database<typeof schema>;

export interface OpenDbOptions {
  /** Path to the SQLite file, or ":memory:" for tests. */
  url?: string;
}

export function openDb(options: OpenDbOptions = {}): { db: EngineDb; sqlite: Database.Database } {
  const sqlite = new Database(options.url ?? process.env.DATABASE_URL ?? "tarima.db");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
