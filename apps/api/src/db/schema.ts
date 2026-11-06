import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

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
  // Free-form goal payload; the contract exposes it as an optional JSON record.
  goal: text("goal", { mode: "json" })
    .notNull()
    .default(sql`'{}'`)
    .$type<Record<string, unknown>>(),
  // Approval-flow stage (contract PROJECT_STAGES).
  stage: text("stage").notNull().default("brief"),
  // Epoch ms the send gate was approved (null = not approved). One
  // approval per project run: a chase started after the approval
  // inherits it and its staged drafts are released without a second
  // gate decision.
  sendApprovedAt: integer("send_approved_at"),
  createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  updatedAt: integer("updated_at").notNull().$defaultFn(nowMs),
});

export const entityStatuses = [
  "candidate",
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

// The durable journal tables (workflows, steps, outbox) used to live in
// @tarima/engine/schema; SP7 inlined them here when the engine package
// was removed. SQL is unchanged, so apps/api/drizzle/*.sql stays the
// migration source of truth.
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
    status: text("status")
      .notNull()
      .$type<"pending" | "staged" | "sent" | "failed">()
      .default("pending"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    sentAt: integer("sent_at"),
  },
  (t) => [uniqueIndex("idx_outbox_key").on(t.idempotencyKey)],
);

// ---------- Stage 3: auth-core OTP ----------

/**
 * One row per issued OTP. Email is the natural key: the api burns prior
 * unconsumed rows on reissue by marking `consumed_at` set, then inserting
 * a fresh row. `attempts` is the failed-verify counter on the current
 * code; once > 5 the api flips `consumed_at` and rejects further compares.
 */
export const otpCodes = sqliteTable(
  "otp_codes",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: integer("expires_at").notNull(),
    consumedAt: integer("consumed_at"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    index("idx_otp_email").on(t.email),
    index("idx_otp_email_unconsumed").on(t.email, t.consumedAt),
  ],
);

export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;

// ---------- Beta workstreams (contract freeze) ----------

/** A user's bound notification channel (Telegram chat, WhatsApp number). */
export const channelBindings = sqliteTable(
  "channel_bindings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().$type<"telegram" | "whatsapp">(),
    externalId: text("external_id").notNull(),
    label: text("label"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    uniqueIndex("idx_channel_bindings_ext").on(t.channel, t.externalId),
    index("idx_channel_bindings_user").on(t.userId),
  ],
);

/** Single-use connect code (stored hashed) a user sends to the bot to bind a channel. */
export const connectCodes = sqliteTable(
  "connect_codes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().$type<"telegram" | "whatsapp">(),
    codeHash: text("code_hash").notNull(),
    expiresAt: integer("expires_at").notNull(),
    consumedAt: integer("consumed_at"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [uniqueIndex("idx_connect_codes_hash").on(t.codeHash)],
);

/** Seed venues the curate service matches a brief against. */
export const venueCatalog = sqliteTable(
  "venue_catalog",
  {
    id: text("id").primaryKey(),
    city: text("city").notNull(),
    name: text("name").notNull(),
    area: text("area"),
    capacity: integer("capacity"),
    priceBand: text("price_band").$type<"low" | "mid" | "high" | "premium">(),
    source: text("source").notNull(),
    url: text("url"),
    // Stream F provider columns: filled by the venue-search service
    // (Photon discovery, Overpass enrichment). Null stays null: the
    // honesty rule is that no provider ever invents a contact, and a
    // venue without one lands in the board's "no contact" bucket.
    externalId: text("external_id"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    website: text("website"),
    // Epoch ms of the last Overpass enrichment pass (null = never).
    enrichedAt: integer("enriched_at"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    provider: text("provider"),
    openingHours: text("opening_hours"),
    contactSource: text("contact_source"),
    rating: real("rating"),
    lastVerifiedAt: integer("last_verified_at"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    index("idx_venue_catalog_city").on(t.city),
    uniqueIndex("idx_venue_catalog_city_name").on(t.city, t.name),
    // The provider idempotency key: a venue found twice by a search is
    // upserted once (`onConflictDoNothing` on this column).
    uniqueIndex("idx_venue_catalog_external").on(t.externalId),
    index("idx_venue_catalog_geo").on(t.city, t.latitude, t.longitude),
  ],
);

/**
 * The search cache (stream F): one row per normalized provider query.
 * A hit returns the cached venue rows from the catalog; a miss calls
 * Photon, upserts every result and records the query here. Rows are
 * fresh for 7 days; a stale hit still answers from the cache and the
 * refresh runs in the background (SWR).
 */
export const searchCache = sqliteTable("search_cache", {
  /** The normalized query hash (see services/venue-search.ts). */
  queryHash: text("query_hash").primaryKey(),
  /** The human-readable normalized query (for ops and debugging). */
  query: text("query").notNull(),
  /** The external ids the search returned, as a json array. */
  venueIds: text("venue_ids", { mode: "json" })
    .notNull()
    .default(sql`'[]'`)
    .$type<string[]>(),
  payload: text("payload"),
  kind: text("kind"),
  expiresAt: integer("expires_at"),
  degraded: integer("degraded").notNull().default(0),
  createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  refreshedAt: integer("refreshed_at").notNull().$defaultFn(nowMs),
});

/** Materialized mini-catalog per H3-ish cell × category (phase 2). */
export const placeCache = sqliteTable(
  "place_cache",
  {
    cell: text("cell").notNull(),
    category: text("category").notNull(),
    radiusM: integer("radius_m").notNull(),
    payload: text("payload").notNull(),
    source: text("source").notNull(),
    providerRunAt: integer("provider_run_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    stale: integer("stale").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.cell, t.category] })],
);

export const providerBudget = sqliteTable(
  "provider_budget",
  {
    provider: text("provider").notNull(),
    day: text("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.provider, t.day] })],
);

export const providerCircuit = sqliteTable("provider_circuit", {
  provider: text("provider").primaryKey(),
  failures: integer("failures").notNull().default(0),
  openedAt: integer("opened_at"),
  state: text("state").notNull().default("closed"),
});

export type SearchCache = typeof searchCache.$inferSelect;
export type VenueCatalogRow = typeof venueCatalog.$inferSelect;

/**
 * In-app inbox (Stage B, channels stream).
 *
 * The notify fanout writes one row per user per notification: the
 * in-app copy of what also goes out to Telegram and WhatsApp. The
 * `events` table was not reused: it is an append-only audit trail
 * without an owner-scoped read path and without a read state, and the
 * board SSE stream reads it. The inbox needs both.
 */
export const userMessages = sqliteTable(
  "user_messages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().$type<"status_change" | "approval_needed" | "digest">(),
    /** Short plain text, the same copy that goes to the chat channels. */
    summary: text("summary").notNull(),
    /** Read state of the in-app copy (the chat copies are fire and forget). */
    readAt: integer("read_at"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    index("idx_user_messages_user").on(t.userId, t.createdAt),
    index("idx_user_messages_unread").on(t.userId, t.readAt),
  ],
);

export type UserMessage = typeof userMessages.$inferSelect;

/**
 * Read-only observer share links for the negotiation room.
 *
 * Implements the Brioso stored-token pattern:
 * - 24 random bytes hex token (unique index)
 * - Project and optional room scoped
 * - 7-day default TTL (expiresAt), nullable for indefinite
 * - Explicit revocation (revokedAt)
 * - View tracking (viewCount, lastViewedAt)
 */
export const roomShareLinks = sqliteTable(
  "room_share_links",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    roomId: text("room_id"),
    token: text("token").notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    expiresAt: integer("expires_at"),
    revokedAt: integer("revoked_at"),
    viewCount: integer("view_count").notNull().default(0),
    lastViewedAt: integer("last_viewed_at"),
  },
  (t) => [
    uniqueIndex("idx_room_share_links_token").on(t.token),
    index("idx_room_share_links_project").on(t.projectId),
  ],
);

export type RoomShareLink = typeof roomShareLinks.$inferSelect;
export type NewRoomShareLink = typeof roomShareLinks.$inferInsert;

// ---------- Phase 2: deal tables (negotiation room) ----------

/** Versioned requirements per project; current = max version. */
export const dealSpecs = sqliteTable(
  "deal_specs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    spec: text("spec", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    changedBy: text("changed_by"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    updatedAt: integer("updated_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    index("idx_deal_specs_project").on(t.projectId),
    uniqueIndex("idx_deal_specs_project_version").on(t.projectId, t.version),
  ],
);

export type DealSpec = typeof dealSpecs.$inferSelect;
export type NewDealSpec = typeof dealSpecs.$inferInsert;

/** Append-only proposal revisions per negotiation; never updated. */
export const proposalVersions = sqliteTable(
  "proposal_versions",
  {
    id: text("id").primaryKey(),
    negotiationId: text("negotiation_id").notNull(),
    revision: integer("revision").notNull(),
    terms: text("terms", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    audit: text("audit", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    draftCounter: text("draft_counter"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    index("idx_proposal_versions_negotiation").on(t.negotiationId),
    uniqueIndex("idx_proposal_versions_negotiation_rev").on(t.negotiationId, t.revision),
  ],
);

export type ProposalVersion = typeof proposalVersions.$inferSelect;
export type NewProposalVersion = typeof proposalVersions.$inferInsert;

/** Human and vendor decisions on proposals. */
export const dealDecisions = sqliteTable(
  "deal_decisions",
  {
    id: text("id").primaryKey(),
    negotiationId: text("negotiation_id").notNull(),
    decision: text("decision")
      .notNull()
      .$type<"approve" | "reject" | "comment" | "vendor_accept">(),
    by: text("by").notNull(),
    text: text("text"),
    at: integer("at").notNull().$defaultFn(nowMs),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    index("idx_deal_decisions_negotiation").on(t.negotiationId),
    index("idx_deal_decisions_at").on(t.at),
  ],
);

export type DealDecision = typeof dealDecisions.$inferSelect;
export type NewDealDecision = typeof dealDecisions.$inferInsert;

/** Closed deals with winning negotiation and final terms. */
export const deals = sqliteTable(
  "deals",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    specVersion: integer("spec_version"),
    winningNegotiationId: text("winning_negotiation_id").notNull(),
    finalTerms: text("final_terms", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    budgetDelta: real("budget_delta"),
    closedAt: integer("closed_at"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    updatedAt: integer("updated_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    index("idx_deals_project").on(t.projectId),
    index("idx_deals_winning_negotiation").on(t.winningNegotiationId),
  ],
);

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;

/** Persisted comparison grid per project so the UI renders without recompute. */
export const dealComparison = sqliteTable(
  "deal_comparison",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    grid: text("grid", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown> | Array<Record<string, unknown>>>(),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
    updatedAt: integer("updated_at").notNull().$defaultFn(nowMs),
  },
  (t) => [index("idx_deal_comparison_project").on(t.projectId)],
);

export type DealComparison = typeof dealComparison.$inferSelect;
export type NewDealComparison = typeof dealComparison.$inferInsert;

/**
 * Mirror of the eve session facts (audit). Keyed by the fact's position on
 * the session stream (`session_id`, `line`, `idx`) so a retried hook step
 * re-inserting the same fact is a no-op.
 */
export const agentEvents = sqliteTable(
  "agent_events",
  {
    sessionId: text("session_id").notNull(),
    line: integer("line").notNull(),
    idx: integer("idx").notNull(),
    type: text("type").notNull(),
    principalId: text("principal_id"),
    payload: text("payload", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.line, t.idx] }),
    index("idx_agent_events_session").on(t.sessionId, t.createdAt),
    index("idx_agent_events_type").on(t.type, t.createdAt),
  ],
);

export type AgentEvent = typeof agentEvents.$inferSelect;
export type NewAgentEvent = typeof agentEvents.$inferInsert;

/**
 * Mirror of eve's approval interactions (plan D8): eve owns the gate, we
 * record every request and its outcome for the audit tab.
 */
export const approvals = sqliteTable(
  "approvals",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    interactionId: text("interaction_id").notNull(),
    toolName: text("tool_name").notNull(),
    callId: text("call_id"),
    projectId: text("project_id"),
    principalId: text("principal_id"),
    status: text("status").notNull(),
    requestPayload: text("request_payload", { mode: "json" })
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    decidedBy: text("decided_by"),
    decidedAt: integer("decided_at"),
    createdAt: integer("created_at").notNull().$defaultFn(nowMs),
  },
  (t) => [
    uniqueIndex("idx_approvals_interaction").on(t.interactionId),
    index("idx_approvals_session").on(t.sessionId, t.createdAt),
    index("idx_approvals_status").on(t.status, t.createdAt),
  ],
);

export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;
