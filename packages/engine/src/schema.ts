import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * The durable journal schema: workflows, steps and the outbox.
 *
 * These tables live in the engine package rather than in apps/api so the
 * engine does not depend on an application. The app re-exports them for its
 * own drizzle instance; the SQL is identical, so the migration files in
 * apps/api/drizzle remain the source of truth for what lands on disk.
 */
const nowMs = () => Date.now();

export const workflows = sqliteTable(
  "workflows",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    status: text("status").notNull().$type<"running" | "done" | "failed">().default("running"),
    // Current SFM state, owned by the domain layer.
    state: text("state").notNull().default(""),
    context: text("context", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    updatedAt: integer("updated_at").notNull().$defaultFn(nowMs),
  },
  (t) => [index("idx_workflows_status").on(t.status)],
);

export const steps = sqliteTable(
  "steps",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    stepKey: text("step_key").notNull(),
    status: text("status")
      .notNull()
      .$type<"pending" | "running" | "done" | "failed">()
      .default("pending"),
    input: text("input", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    output: text("output", { mode: "json" }).$type<Record<string, unknown>>(),
    retries: integer("retries").notNull().default(0),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: integer("lease_expires_at"),
    runAt: integer("run_at").notNull().$defaultFn(nowMs),
    error: text("error"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    updatedAt: integer("updated_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    uniqueIndex("idx_steps_run_key").on(t.runId, t.stepKey),
    index("idx_steps_due").on(t.status, t.runAt),
  ],
);

export const outbox = sqliteTable(
  "outbox",
  {
    id: text("id").primaryKey(),
    // Side-effect idempotency key: senders must treat duplicates as no-ops.
    idempotencyKey: text("idempotency_key").notNull(),
    type: text("type").notNull(),
    payload: text("payload", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    status: text("status").notNull().$type<"pending" | "sent" | "failed">().default("pending"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    sentAt: integer("sent_at"),
  },
  (t) => [uniqueIndex("idx_outbox_key").on(t.idempotencyKey)],
);
