import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const sqlite = new Database(process.env.DATABASE_URL ?? 'tarima.db')
sqlite.pragma('journal_mode = WAL')

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS access_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    intent TEXT,
    created_at INTEGER NOT NULL
  )
`)

export const db = drizzle(sqlite, { schema })
