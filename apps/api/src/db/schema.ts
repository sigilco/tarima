import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Timestamps are unix epoch milliseconds (integer). Ids are TEXT (uuid/nanoid)
// except access_requests, which keeps its legacy autoincrement id.

export const accessRequests = sqliteTable("access_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  intent: text("intent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type NewAccessRequest = typeof accessRequests.$inferInsert;

const nowMs = () => Date.now();

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    role: text("role").notNull().default("member"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [uniqueIndex("idx_users_email").on(t.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    uniqueIndex("idx_sessions_token").on(t.tokenHash),
    index("idx_sessions_user").on(t.userId),
  ],
);

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default(""),
    prefix: text("prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: text("scopes", { mode: "json" })
      .notNull()
      .default(sql`'[]'`)
      .$type<string[]>(),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    revokedAt: integer("revoked_at"),
  },
  (t) => [uniqueIndex("idx_api_keys_hash").on(t.keyHash), index("idx_api_keys_user").on(t.userId)],
);

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  updatedAt: integer("updated_at").notNull().$defaultFn(nowMs),
});

export const entityStatuses = [
  "pending",
  "intake",
  "chasing",
  "await_reply",
  "parsed",
  "validated",
  "updated",
  "notified",
  "done",
  "failed",
] as const;

export type EntityStatus = (typeof entityStatuses)[number];

export const entities = sqliteTable(
  "entities",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    contactEmail: text("contact_email"),
    // Goal payload from intake: free-form JSON now, contract schemas later.
    goal: text("goal", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    result: text("result", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    status: text("status").notNull().$type<EntityStatus>().default("pending"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    updatedAt: integer("updated_at").notNull().$defaultFn(nowMs),
  },
  (t) => [index("idx_entities_project").on(t.projectId, t.status)],
);

export const outreachMessages = sqliteTable(
  "outreach_messages",
  {
    id: text("id").primaryKey(),
    entityId: text("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    direction: text("direction").notNull().$type<"outbound" | "inbound">(),
    subject: text("subject"),
    body: text("body").notNull(),
    followUpOf: text("follow_up_of"),
    sentAt: integer("sent_at"),
    receivedAt: integer("received_at"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [index("idx_messages_entity").on(t.entityId)],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    // actor: user id, api key id, 'system', 'workflow:<runId>', ...
    actor: text("actor").notNull(),
    type: text("type").notNull(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    data: text("data", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [index("idx_events_subject").on(t.subjectType, t.subjectId)],
);

export const loopbackInbox = sqliteTable(
  "loopback_inbox",
  {
    id: text("id").primaryKey(),
    toAddr: text("to_addr").notNull(),
    fromAddr: text("from_addr"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    html: text("html"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [index("idx_inbox_to").on(t.toAddr)],
);

// ---------- Durable engine journal ----------

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
