CREATE TABLE `gtm_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`consent` integer DEFAULT false NOT NULL,
	`do_not_contact` integer DEFAULT false NOT NULL,
	`do_not_contact_reason` text,
	`project_id` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_gtm_contacts_email` ON `gtm_contacts` (`email`);--> statement-breakpoint
CREATE INDEX `idx_gtm_contacts_dnc` ON `gtm_contacts` (`do_not_contact`);