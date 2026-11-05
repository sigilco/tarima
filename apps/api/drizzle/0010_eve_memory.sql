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
