/**
 * Telegram bot wiring for the api (Stage 5, T5.1).
 *
 * Reads `TELEGRAM_BOT_TOKEN` (and the optional `TELEGRAM_API_BASE`) from
 * the environment, builds the bot over the db-backed digest source and
 * starts long polling. Without a token the module is a no-op, so local
 * dev and CI run Telegram-free.
 *
 * Bindings are in-memory for now: they reset on restart. The sqlite
 * backed store lands with the Stage 3 service layer, which owns the db
 * conventions this branch does not have yet.
 *
 * TODO(stage3-merge): swap the MemoryBindingStore for a sqlite-backed
 * BindingStore and reuse services/status-map for the state translation.
 */
import { eq } from "drizzle-orm";
import {
  MemoryBindingStore,
  createTelegram,
  startLongPoll,
  type BindingStore,
  type DigestInput,
  type DigestRow,
  type DigestTotals,
  type TelegramBot,
} from "@tarima/telegram";
import { db } from "./db";
import { entities, projects, type EntityStatus } from "./db/schema";

/**
 * Digest bucket of a db status. Only the four board buckets count;
 * pre-outreach rows (pending, intake) land in none of them but still
 * count toward the total.
 */
const DIGEST_BUCKET: Partial<Record<EntityStatus, keyof Omit<DigestTotals, "total">>> = {
  chasing: "chasing",
  await_reply: "awaiting",
  done: "done",
  failed: "blocked",
};

/**
 * Db status to wire state, the same translation services/status-map
 * applies on main. Narrow copy of the table until the Stage 3 services
 * land on this branch.
 */
const TO_WIRE: Record<EntityStatus, string> = {
  pending: "intake",
  intake: "intake",
  chasing: "chasing",
  await_reply: "awaiting_reply",
  parsed: "replied",
  validated: "validating",
  updated: "updating",
  notified: "notifying",
  done: "done",
  failed: "blocked",
};

/** The `missing` list out of an entity's goal bag. */
function readMissing(goal: Record<string, unknown> | null): string[] {
  const missing = (goal ?? {}).missing;
  return Array.isArray(missing)
    ? missing.filter((item): item is string => typeof item === "string")
    : [];
}

/**
 * Build the digest of a project from the db, or null when the project
 * does not exist. This is the `DigestSource` the bot reads.
 */
async function digestFor(projectId: string): Promise<DigestInput | null> {
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) return null;

  const rows = db.select().from(entities).where(eq(entities.projectId, projectId)).all();

  const totals: DigestTotals = { done: 0, chasing: 0, awaiting: 0, blocked: 0, total: rows.length };
  const digestRows: DigestRow[] = rows.map((row) => {
    const bucket = DIGEST_BUCKET[row.status];
    if (bucket) totals[bucket] += 1;
    return {
      name: row.name,
      status: TO_WIRE[row.status] ?? "intake",
      missing: readMissing(row.goal),
    };
  });

  return { projectId, projectName: project.name, rows: digestRows, totals };
}

/** The bot handle, as a running singleton needs it. */
let running: TelegramBot | undefined;

/**
 * Push the digest of a project to every chat bound to it. Callers (a
 * cron tick, a workflow step) invoke this after the board changes.
 * Without a running bot this is a no-op.
 */
export async function pushDigest(projectId: string): Promise<void> {
  if (!running) return;
  await running.pushDigest(projectId);
}

/**
 * Start the Telegram bot when a token is configured. Never throws: a
 * network failure inside long polling is retried by `startLongPoll`,
 * and a bad token is logged and swallowed so boot is never blocked.
 */
export async function startTelegram(): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) return;

  const store: BindingStore = new MemoryBindingStore();
  const handle = createTelegram(
    { botToken, apiBase: process.env.TELEGRAM_API_BASE?.trim() || undefined },
    { store, source: { digest: digestFor } },
  );
  if (!handle) return;
  running = handle;

  await startLongPoll(handle.bot);
}
