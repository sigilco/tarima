/**
 * Tarima SQLite `StateAdapter` for Chat SDK (W3): the same better-sqlite3
 * database the app already uses, in an own table — no second state store
 * to back up. Modelled on the vendored `@chat-adapter/state-memory`, with
 * the memory Map replaced by one row per key so Chat SDK locks, dedupe
 * markers, thread state and queues survive a restart (a state adapter is
 * required in production for WhatsApp BSUID aliases and idempotency).
 *
 * better-sqlite3 is synchronous, so every async method resolves on the
 * same tick; correctness comes from the upserts/compares below, not from
 * scheduling. Lock tokens, TTL sweeps and queue trims mirror the memory
 * adapter's semantics exactly.
 */
import Database from "better-sqlite3";
import type { Lock, QueueEntry, StateAdapter } from "chat";

interface Row {
  key: string;
  value: string;
  expires_at: number | null;
}

/** Rows per list key are keyed `list\0<key>`, queue rows `queue\0<threadId>\0<seq>`. */
const LIST_PREFIX = "list\0";
const QUEUE_PREFIX = "queue\0";

export interface SqliteStateAdapterOptions {
  /** A better-sqlite3 `Database` to share with the app. */
  database: Database.Database;
  /** Table name; created on first use. Defaults to `chat_sdk_state`. */
  table?: string;
}

export class SqliteStateAdapter implements StateAdapter {
  private readonly db: Database.Database;
  private readonly table: string;

  constructor(options: SqliteStateAdapterOptions) {
    this.db = options.database;
    this.table = options.table ?? "chat_sdk_state";
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER
      )
    `);
  }

  async connect(): Promise<void> {
    // better-sqlite3 opens lazily on first statement; nothing to await.
  }

  async disconnect(): Promise<void> {
    // The shared database is closed by its owner, not by the adapter.
  }

  async subscribe(threadId: string): Promise<void> {
    await this.set(`sub:${threadId}`, true);
  }

  async unsubscribe(threadId: string): Promise<void> {
    await this.delete(`sub:${threadId}`);
  }

  async isSubscribed(threadId: string): Promise<boolean> {
    return (await this.get<boolean>(`sub:${threadId}`)) === true;
  }

  async acquireLock(threadId: string, ttlMs: number): Promise<Lock | null> {
    this.sweep();
    const token = `lock_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const existing = this.row(`lock:${threadId}`);
    const now = Date.now();
    if (existing && existing.expires_at !== null && existing.expires_at > now) return null;
    const lock: Lock = { threadId, token, expiresAt: now + ttlMs };
    this.upsert(`lock:${threadId}`, lock, ttlMs);
    return lock;
  }

  async forceReleaseLock(threadId: string): Promise<void> {
    await this.delete(`lock:${threadId}`);
  }

  async releaseLock(lock: Lock): Promise<void> {
    const existing = this.row(`lock:${lock.threadId}`);
    if (!existing) return;
    const held = JSON.parse(existing.value) as Lock;
    if (held.token !== lock.token) return;
    await this.delete(`lock:${lock.threadId}`);
  }

  async extendLock(lock: Lock, ttlMs: number): Promise<boolean> {
    const existing = this.row(`lock:${lock.threadId}`);
    if (!existing) return false;
    const held = JSON.parse(existing.value) as Lock;
    if (held.token !== lock.token) return false;
    if (held.expiresAt <= Date.now()) return false;
    this.upsert(`lock:${lock.threadId}`, { ...held, expiresAt: Date.now() + ttlMs }, ttlMs);
    return true;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    this.sweep();
    const row = this.row(key);
    if (!row) return null;
    if (row.expires_at !== null && row.expires_at <= Date.now()) {
      this.del(key);
      return null;
    }
    return JSON.parse(row.value) as T;
  }

  async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.upsert(key, value, ttlMs);
  }

  async setIfNotExists(key: string, value: unknown, ttlMs?: number): Promise<boolean> {
    this.sweep();
    const row = this.row(key);
    if (row && row.expires_at !== null && row.expires_at <= Date.now()) this.del(key);
    const result = this.db
      .prepare(
        `INSERT INTO ${this.table} (key, value, expires_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO NOTHING`,
      )
      .run(key, JSON.stringify(value), ttlMs ? Date.now() + ttlMs : null);
    return result.changes > 0;
  }

  async delete(key: string): Promise<void> {
    this.del(key);
  }

  async appendToList(
    key: string,
    value: unknown,
    options?: { maxLength?: number; ttlMs?: number },
  ): Promise<void> {
    const listKey = `${LIST_PREFIX}${key}`;
    const current = (await this.get<unknown[]>(listKey)) ?? [];
    current.push(value);
    const trimmed =
      options?.maxLength && options.maxLength > 0 ? current.slice(-options.maxLength) : current;
    await this.set(listKey, trimmed, options?.ttlMs);
  }

  async getList<T = unknown>(key: string): Promise<T[]> {
    const list = await this.get<T[]>(`${LIST_PREFIX}${key}`);
    return list ?? [];
  }

  async enqueue(threadId: string, entry: QueueEntry, maxSize: number): Promise<number> {
    // A monotonic per-thread sequence keeps key order == insertion order
    // even for entries enqueued within the same millisecond.
    const head = this.db
      .prepare(`SELECT key FROM ${this.table} WHERE key LIKE ? ORDER BY key DESC LIMIT 1`)
      .get(`${QUEUE_PREFIX}${threadId}\0%`) as { key: string } | undefined;
    const lastSeq = Number.parseInt(head?.key.split("\0")[2] ?? "0", 10);
    const suffix = `${lastSeq + 1}_${Math.random().toString(36).slice(2, 8)}`;
    this.upsert(`${QUEUE_PREFIX}${threadId}\0${suffix}`, entry);
    const depth = await this.queueDepth(threadId);
    if (depth > maxSize) {
      const oldest = this.db
        .prepare(`SELECT key FROM ${this.table} WHERE key LIKE ? ORDER BY key ASC LIMIT ?`)
        .all(`${QUEUE_PREFIX}${threadId}\0%`, depth - maxSize) as Array<{ key: string }>;
      for (const row of oldest) this.del(row.key);
      return maxSize;
    }
    return depth;
  }

  async dequeue(threadId: string): Promise<QueueEntry | null> {
    const oldest = this.db
      .prepare(`SELECT key, value FROM ${this.table} WHERE key LIKE ? ORDER BY key ASC LIMIT 1`)
      .get(`${QUEUE_PREFIX}${threadId}\0%`) as Row | undefined;
    if (!oldest) return null;
    this.del(oldest.key);
    return JSON.parse(oldest.value) as QueueEntry;
  }

  async queueDepth(threadId: string): Promise<number> {
    const row = this.db
      .prepare(`SELECT COUNT(*) AS n FROM ${this.table} WHERE key LIKE ?`)
      .get(`${QUEUE_PREFIX}${threadId}\0%`) as { n: number };
    return row.n;
  }

  /** One row by key, without expiry checks. */
  private row(key: string): Row | undefined {
    return this.db
      .prepare(`SELECT key, value, expires_at FROM ${this.table} WHERE key = ?`)
      .get(key) as Row | undefined;
  }

  private upsert(key: string, value: unknown, ttlMs?: number): void {
    this.db
      .prepare(
        `INSERT INTO ${this.table} (key, value, expires_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at`,
      )
      .run(key, JSON.stringify(value), ttlMs ? Date.now() + ttlMs : null);
  }

  private del(key: string): void {
    this.db.prepare(`DELETE FROM ${this.table} WHERE key = ?`).run(key);
  }

  /** Expired lock sweep, so `acquireLock` can reclaim without an extra index. */
  private sweep(): void {
    this.db
      .prepare(`DELETE FROM ${this.table} WHERE key LIKE 'lock:%' AND expires_at <= ?`)
      .run(Date.now());
  }
}

/** Build the adapter over an existing better-sqlite3 connection. */
export function createSqliteState(options: SqliteStateAdapterOptions): SqliteStateAdapter {
  return new SqliteStateAdapter(options);
}
