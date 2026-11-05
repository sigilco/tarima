CREATE TABLE `agent_events` (
	`session_id` text NOT NULL,
	`line` integer NOT NULL,
	`idx` integer NOT NULL,
	`type` text NOT NULL,
	`principal_id` text,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `line`, `idx`)
);
--> statement-breakpoint
CREATE INDEX `idx_agent_events_session` ON `agent_events` (`session_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_agent_events_type` ON `agent_events` (`type`,`created_at`);--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`interaction_id` text NOT NULL,
	`tool_name` text NOT NULL,
	`call_id` text,
	`project_id` text,
	`principal_id` text,
	`status` text NOT NULL,
	`request_payload` text DEFAULT '{}' NOT NULL,
	`decided_by` text,
	`decided_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_approvals_interaction` ON `approvals` (`interaction_id`);--> statement-breakpoint
CREATE INDEX `idx_approvals_session` ON `approvals` (`session_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_approvals_status` ON `approvals` (`status`,`created_at`);