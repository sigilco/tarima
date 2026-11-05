import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL ?? "tarima.db");
sqlite.pragma("journal_mode = WAL");

// Bootstrap DDL so a fresh `pnpm dev` or test run lands on a working
// schema without waiting for `drizzle-kit push`. Statements mirror
// apps/api/drizzle/*.sql exactly; migrations remain the source of
// truth and are applied on deploy.
const BOOTSTRAP_DDL = [
  "CREATE TABLE IF NOT EXISTS `access_requests` ( `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `email` text NOT NULL, `intent` text, `created_at` integer NOT NULL );",
  "CREATE TABLE IF NOT EXISTS `api_keys` ( `id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `name` text DEFAULT '' NOT NULL, `prefix` text NOT NULL, `key_hash` text NOT NULL, `scopes` text DEFAULT '[]' NOT NULL, `created_at` integer NOT NULL, `revoked_at` integer, FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE TABLE IF NOT EXISTS `entities` ( `id` text PRIMARY KEY NOT NULL, `project_id` text NOT NULL, `name` text NOT NULL, `contact_email` text, `goal` text DEFAULT '{}' NOT NULL, `result` text DEFAULT '{}' NOT NULL, `status` text DEFAULT 'pending' NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE TABLE IF NOT EXISTS `events` ( `id` text PRIMARY KEY NOT NULL, `actor` text NOT NULL, `type` text NOT NULL, `subject_type` text NOT NULL, `subject_id` text NOT NULL, `data` text DEFAULT '{}' NOT NULL, `created_at` integer NOT NULL );",
  "CREATE TABLE IF NOT EXISTS `loopback_inbox` ( `id` text PRIMARY KEY NOT NULL, `to_addr` text NOT NULL, `from_addr` text, `subject` text NOT NULL, `body` text NOT NULL, `html` text, `created_at` integer NOT NULL );",
  "CREATE TABLE IF NOT EXISTS `outbox` ( `id` text PRIMARY KEY NOT NULL, `idempotency_key` text NOT NULL, `type` text NOT NULL, `payload` text DEFAULT '{}' NOT NULL, `status` text DEFAULT 'pending' NOT NULL, `created_at` integer NOT NULL, `sent_at` integer );",
  "CREATE TABLE IF NOT EXISTS `outreach_messages` ( `id` text PRIMARY KEY NOT NULL, `entity_id` text NOT NULL, `direction` text NOT NULL, `subject` text, `body` text NOT NULL, `follow_up_of` text, `sent_at` integer, `received_at` integer, `created_at` integer NOT NULL, FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE TABLE IF NOT EXISTS `projects` ( `id` text PRIMARY KEY NOT NULL, `owner_id` text, `name` text NOT NULL, `description` text, `goal` text DEFAULT '{}' NOT NULL, `stage` text DEFAULT 'brief' NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null );",
  "CREATE TABLE IF NOT EXISTS `sessions` ( `id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `token_hash` text NOT NULL, `expires_at` integer NOT NULL, `created_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE TABLE IF NOT EXISTS `steps` ( `id` text PRIMARY KEY NOT NULL, `run_id` text NOT NULL, `step_key` text NOT NULL, `status` text DEFAULT 'pending' NOT NULL, `input` text DEFAULT '{}' NOT NULL, `output` text, `retries` integer DEFAULT 0 NOT NULL, `lease_owner` text, `lease_expires_at` integer, `run_at` integer NOT NULL, `error` text, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`run_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE TABLE IF NOT EXISTS `users` ( `id` text PRIMARY KEY NOT NULL, `email` text NOT NULL, `name` text, `role` text DEFAULT 'member' NOT NULL, `created_at` integer NOT NULL );",
  "CREATE TABLE IF NOT EXISTS `workflows` ( `id` text PRIMARY KEY NOT NULL, `type` text NOT NULL, `status` text DEFAULT 'running' NOT NULL, `state` text DEFAULT '' NOT NULL, `context` text DEFAULT '{}' NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL );",
  "CREATE INDEX IF NOT EXISTS `idx_api_keys_user` ON `api_keys` (`user_id`);",
  "CREATE INDEX IF NOT EXISTS `idx_entities_project` ON `entities` (`project_id`,`status`);",
  "CREATE INDEX IF NOT EXISTS `idx_events_subject` ON `events` (`subject_type`,`subject_id`);",
  "CREATE INDEX IF NOT EXISTS `idx_inbox_to` ON `loopback_inbox` (`to_addr`);",
  "CREATE INDEX IF NOT EXISTS `idx_messages_entity` ON `outreach_messages` (`entity_id`);",
  "CREATE INDEX IF NOT EXISTS `idx_sessions_user` ON `sessions` (`user_id`);",
  "CREATE INDEX IF NOT EXISTS `idx_steps_due` ON `steps` (`status`,`run_at`);",
  "CREATE INDEX IF NOT EXISTS `idx_workflows_status` ON `workflows` (`status`);",
  "CREATE TABLE IF NOT EXISTS `otp_codes` ( `id` text PRIMARY KEY NOT NULL, `email` text NOT NULL, `code_hash` text NOT NULL, `attempts` integer DEFAULT 0 NOT NULL, `expires_at` integer NOT NULL, `consumed_at` integer, `created_at` integer NOT NULL );",
  "CREATE INDEX IF NOT EXISTS `idx_otp_email` ON `otp_codes` (`email`);",
  "CREATE INDEX IF NOT EXISTS `idx_otp_email_unconsumed` ON `otp_codes` (`email`,`consumed_at`);",
  "CREATE TABLE IF NOT EXISTS `channel_bindings` ( `id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `channel` text NOT NULL, `external_id` text NOT NULL, `label` text, `created_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE UNIQUE INDEX IF NOT EXISTS `idx_channel_bindings_ext` ON `channel_bindings` (`channel`,`external_id`);",
  "CREATE INDEX IF NOT EXISTS `idx_channel_bindings_user` ON `channel_bindings` (`user_id`);",
  "CREATE TABLE IF NOT EXISTS `connect_codes` ( `id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `channel` text NOT NULL, `code_hash` text NOT NULL, `expires_at` integer NOT NULL, `consumed_at` integer, `created_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE UNIQUE INDEX IF NOT EXISTS `idx_connect_codes_hash` ON `connect_codes` (`code_hash`);",
  "CREATE TABLE IF NOT EXISTS `venue_catalog` ( `id` text PRIMARY KEY NOT NULL, `city` text NOT NULL, `name` text NOT NULL, `area` text, `capacity` integer, `price_band` text, `source` text NOT NULL, `url` text, `external_id` text, `contact_email` text, `contact_phone` text, `website` text, `enriched_at` integer, `created_at` integer NOT NULL );",
  "CREATE INDEX IF NOT EXISTS `idx_venue_catalog_city` ON `venue_catalog` (`city`);",
  "CREATE UNIQUE INDEX IF NOT EXISTS `idx_venue_catalog_city_name` ON `venue_catalog` (`city`,`name`);",
  "CREATE TABLE IF NOT EXISTS `search_cache` ( `query_hash` text PRIMARY KEY NOT NULL, `query` text NOT NULL, `venue_ids` text DEFAULT '[]' NOT NULL, `created_at` integer NOT NULL, `refreshed_at` integer NOT NULL );",
  "CREATE TABLE IF NOT EXISTS `user_messages` ( `id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `project_id` text, `kind` text NOT NULL, `summary` text NOT NULL, `read_at` integer, `created_at` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade, FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE INDEX IF NOT EXISTS `idx_user_messages_user` ON `user_messages` (`user_id`,`created_at`);",
  "CREATE INDEX IF NOT EXISTS `idx_user_messages_unread` ON `user_messages` (`user_id`,`read_at`);",
  "CREATE TABLE IF NOT EXISTS `room_share_links` ( `id` text PRIMARY KEY NOT NULL, `project_id` text NOT NULL, `room_id` text, `token` text NOT NULL, `created_by` text, `created_at` integer NOT NULL, `expires_at` integer, `revoked_at` integer, `view_count` integer DEFAULT 0 NOT NULL, `last_viewed_at` integer, FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade, FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null );",
  "CREATE UNIQUE INDEX IF NOT EXISTS `idx_room_share_links_token` ON `room_share_links` (`token`);",
  "CREATE INDEX IF NOT EXISTS `idx_room_share_links_project` ON `room_share_links` (`project_id`);",
  "CREATE TABLE IF NOT EXISTS `deal_specs` ( `id` text PRIMARY KEY NOT NULL, `project_id` text NOT NULL, `version` integer NOT NULL, `spec` text DEFAULT '{}' NOT NULL, `changed_by` text, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE INDEX IF NOT EXISTS `idx_deal_specs_project` ON `deal_specs` (`project_id`);",
  "CREATE UNIQUE INDEX IF NOT EXISTS `idx_deal_specs_project_version` ON `deal_specs` (`project_id`,`version`);",
  "CREATE TABLE IF NOT EXISTS `proposal_versions` ( `id` text PRIMARY KEY NOT NULL, `negotiation_id` text NOT NULL, `revision` integer NOT NULL, `terms` text DEFAULT '{}' NOT NULL, `audit` text DEFAULT '{}' NOT NULL, `draft_counter` text, `created_at` integer NOT NULL );",
  "CREATE INDEX IF NOT EXISTS `idx_proposal_versions_negotiation` ON `proposal_versions` (`negotiation_id`);",
  "CREATE UNIQUE INDEX IF NOT EXISTS `idx_proposal_versions_negotiation_rev` ON `proposal_versions` (`negotiation_id`,`revision`);",
  "CREATE TABLE IF NOT EXISTS `deal_decisions` ( `id` text PRIMARY KEY NOT NULL, `negotiation_id` text NOT NULL, `decision` text NOT NULL, `by` text NOT NULL, `text` text, `at` integer NOT NULL, `created_at` integer NOT NULL );",
  "CREATE INDEX IF NOT EXISTS `idx_deal_decisions_negotiation` ON `deal_decisions` (`negotiation_id`);",
  "CREATE INDEX IF NOT EXISTS `idx_deal_decisions_at` ON `deal_decisions` (`at`);",
  "CREATE TABLE IF NOT EXISTS `deals` ( `id` text PRIMARY KEY NOT NULL, `project_id` text NOT NULL, `spec_version` integer, `winning_negotiation_id` text NOT NULL, `final_terms` text DEFAULT '{}' NOT NULL, `budget_delta` real, `closed_at` integer, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE INDEX IF NOT EXISTS `idx_deals_project` ON `deals` (`project_id`);",
  "CREATE INDEX IF NOT EXISTS `idx_deals_winning_negotiation` ON `deals` (`winning_negotiation_id`);",
  "CREATE TABLE IF NOT EXISTS `deal_comparison` ( `id` text PRIMARY KEY NOT NULL, `project_id` text NOT NULL, `grid` text DEFAULT '{}' NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade );",
  "CREATE INDEX IF NOT EXISTS `idx_deal_comparison_project` ON `deal_comparison` (`project_id`);",
  "CREATE TABLE IF NOT EXISTS `agent_events` ( `session_id` text NOT NULL, `line` integer NOT NULL, `idx` integer NOT NULL, `type` text NOT NULL, `principal_id` text, `payload` text DEFAULT '{}' NOT NULL, `created_at` integer NOT NULL, PRIMARY KEY(`session_id`, `line`, `idx`) );",
  "CREATE INDEX IF NOT EXISTS `idx_agent_events_session` ON `agent_events` (`session_id`,`created_at`);",
  "CREATE INDEX IF NOT EXISTS `idx_agent_events_type` ON `agent_events` (`type`,`created_at`);",
  "CREATE TABLE IF NOT EXISTS `approvals` ( `id` text PRIMARY KEY NOT NULL, `session_id` text NOT NULL, `interaction_id` text NOT NULL, `tool_name` text NOT NULL, `call_id` text, `project_id` text, `principal_id` text, `status` text NOT NULL, `request_payload` text DEFAULT '{}' NOT NULL, `decided_by` text, `decided_at` integer, `created_at` integer NOT NULL );",
  "CREATE UNIQUE INDEX IF NOT EXISTS `idx_approvals_interaction` ON `approvals` (`interaction_id`);",
  "CREATE INDEX IF NOT EXISTS `idx_approvals_session` ON `approvals` (`session_id`,`created_at`);",
  "CREATE INDEX IF NOT EXISTS `idx_approvals_status` ON `approvals` (`status`,`created_at`);",
];

for (const statement of BOOTSTRAP_DDL) {
  try {
    sqlite.exec(statement);
  } catch (err) {
    // Two importers can race the bootstrap (parallel vitest workers on
    // one shared DATABASE_URL). Every statement is IF NOT EXISTS or an
    // idempotent index, so losing the race is fine; rethrow anything
    // that is not a duplicate-table/index/column error.
    const message = err instanceof Error ? err.message : String(err);
    if (!/already exists/i.test(message)) throw err;
  }
}

// Databases created before migration 0003 lack projects.stage; CREATE TABLE IF
// NOT EXISTS leaves them untouched, so add the column in place.
function addColumnIfMissing(table: string, column: string, ddl: string): void {
  const columns = sqlite.prepare(`PRAGMA table_info(\`${table}\`)`).all() as { name: string }[];
  if (columns.some((c) => c.name === column)) return;
  try {
    sqlite.exec(ddl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(message)) throw err;
  }
}
addColumnIfMissing(
  "projects",
  "stage",
  "ALTER TABLE `projects` ADD `stage` text DEFAULT 'brief' NOT NULL;",
);
addColumnIfMissing(
  "projects",
  "send_approved_at",
  "ALTER TABLE `projects` ADD `send_approved_at` integer;",
);

// Databases created before migration 0006 lack the venue-search columns;
// CREATE TABLE IF NOT EXISTS leaves them untouched, so add them in place.
addColumnIfMissing(
  "venue_catalog",
  "external_id",
  "ALTER TABLE `venue_catalog` ADD `external_id` text;",
);
addColumnIfMissing(
  "venue_catalog",
  "contact_email",
  "ALTER TABLE `venue_catalog` ADD `contact_email` text;",
);
addColumnIfMissing(
  "venue_catalog",
  "contact_phone",
  "ALTER TABLE `venue_catalog` ADD `contact_phone` text;",
);
addColumnIfMissing("venue_catalog", "website", "ALTER TABLE `venue_catalog` ADD `website` text;");
addColumnIfMissing(
  "venue_catalog",
  "enriched_at",
  "ALTER TABLE `venue_catalog` ADD `enriched_at` integer;",
);
// The provider index lands once the column exists (also when the column
// was just added above).
sqlite.exec(
  "CREATE UNIQUE INDEX IF NOT EXISTS `idx_venue_catalog_external` ON `venue_catalog` (`external_id`);",
);

export const db = drizzle(sqlite, { schema });
