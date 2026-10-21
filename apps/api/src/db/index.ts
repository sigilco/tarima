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
  "CREATE TABLE IF NOT EXISTS `projects` ( `id` text PRIMARY KEY NOT NULL, `owner_id` text, `name` text NOT NULL, `description` text, `goal` text DEFAULT '{}' NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null );",
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
];

for (const statement of BOOTSTRAP_DDL) {
  sqlite.exec(statement);
}

export const db = drizzle(sqlite, { schema });
