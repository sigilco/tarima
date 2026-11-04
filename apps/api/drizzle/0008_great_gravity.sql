CREATE TABLE `deal_comparison` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`grid` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_deal_comparison_project` ON `deal_comparison` (`project_id`);--> statement-breakpoint
CREATE TABLE `deal_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`negotiation_id` text NOT NULL,
	`decision` text NOT NULL,
	`by` text NOT NULL,
	`text` text,
	`at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_deal_decisions_negotiation` ON `deal_decisions` (`negotiation_id`);--> statement-breakpoint
CREATE INDEX `idx_deal_decisions_at` ON `deal_decisions` (`at`);--> statement-breakpoint
CREATE TABLE `deal_specs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`version` integer NOT NULL,
	`spec` text DEFAULT '{}' NOT NULL,
	`changed_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_deal_specs_project` ON `deal_specs` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_deal_specs_project_version` ON `deal_specs` (`project_id`,`version`);--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`spec_version` integer,
	`winning_negotiation_id` text NOT NULL,
	`final_terms` text DEFAULT '{}' NOT NULL,
	`budget_delta` real,
	`closed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_deals_project` ON `deals` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_deals_winning_negotiation` ON `deals` (`winning_negotiation_id`);--> statement-breakpoint
CREATE TABLE `proposal_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`negotiation_id` text NOT NULL,
	`revision` integer NOT NULL,
	`terms` text DEFAULT '{}' NOT NULL,
	`audit` text DEFAULT '{}' NOT NULL,
	`draft_counter` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_proposal_versions_negotiation` ON `proposal_versions` (`negotiation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_proposal_versions_negotiation_rev` ON `proposal_versions` (`negotiation_id`,`revision`);