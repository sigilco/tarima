/**
 * Telegram bot wiring for the api (Stage 5, T5.1; Stage B channels).
 *
 * Reads `TELEGRAM_BOT_TOKEN` (and the optional `TELEGRAM_API_BASE`) from
 * the environment, builds the bot over the db-backed digest source and
 * starts long polling. Without a token the module is a no-op, so local
 * dev and CI run Telegram-free.
 *
 * Bindings are persisted in the `channel_bindings` table (Stage B): a
 * restart no longer loses the chats a user connected. The digest bot
 * itself stays db-free; the api binds it to sqlite through
 * `SqliteBindingStore`.
 *
 * The bot doubles as the connect flow: a tester sends the code the
 * settings page showed (`/start ABC123`) and the api resolves it,
 * writes the binding and confirms in-chat.
 */
import { eq } from "drizzle-orm";
import {
  createTelegram,
  startLongPoll,
  type DigestInput,
  type DigestRow,
  type DigestTotals,
  type TelegramBot,
} from "@tarima/telegram";
import { db } from "./db";
import { entities, projects, type EntityStatus } from "./db/schema";
import { SqliteBindingStore } from "./services/telegram-bindings";
import { bindChannel } from "./services/bindings";
import { resolveConnectCode } from "./services/connect-codes";

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
  candidate: "candidate",
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
 * Resolve a connect code a tester sent to the bot. On success the chat
 * is bound to the user and the confirmation line is returned; an
 * invalid or stale code returns null (the bot then answers with the
 * usage text).
 */
async function resolveConnect(code: string, chatId: number): Promise<string | null> {
  const resolved = resolveConnectCode(db, "telegram", code);
  if (!resolved.ok) return null;

  bindChannel(db, {
    userId: resolved.userId,
    channel: "telegram",
    externalId: String(chatId),
  });

  return "Connected. This chat now gets your Tarima notifications.";
}

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
 * Send one plain message to one Telegram chat. Used by the notify
 * fanout. Throws when the send fails, so the fanout can count it.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!running) return;
  await running.send(Number(chatId), text);
}

/**
 * Start the Telegram bot when a token is configured. Never throws: a
 * network failure inside long polling is retried by `startLongPoll`,
 * and a bad token is logged and swallowed so boot is never blocked.
 */
export async function startTelegram(): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) return;

  const handle = createTelegram(
    { botToken, apiBase: process.env.TELEGRAM_API_BASE?.trim() || undefined },
    {
      store: new SqliteBindingStore(db),
      source: { digest: digestFor },
      connect: { resolve: resolveConnect },
    },
  );
  if (!handle) return;
  running = handle;

  await startLongPoll(handle.bot);
}
