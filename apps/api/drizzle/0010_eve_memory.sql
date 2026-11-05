CREATE TABLE `memory_documents` (
	`key` text PRIMARY KEY NOT NULL,
	`namespace` text NOT NULL,
	`content` text NOT NULL,
	`version` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_memory_documents_namespace` ON `memory_documents` (`namespace`,`updated_at`);
--> statement-breakpoint
CREATE TABLE `memory_journal` (
	`session_id` text NOT NULL,
	`line` integer NOT NULL,
	`idx` integer NOT NULL,
	`call_id` text NOT NULL,
	`principal_id` text,
	`action` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `line`, `idx`)
);
--> statement-breakpoint
CREATE INDEX `idx_memory_journal_principal` ON `memory_journal` (`principal_id`,`created_at`);
