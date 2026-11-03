CREATE TABLE `channel_bindings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`channel` text NOT NULL,
	`external_id` text NOT NULL,
	`label` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_channel_bindings_ext` ON `channel_bindings` (`channel`,`external_id`);--> statement-breakpoint
CREATE INDEX `idx_channel_bindings_user` ON `channel_bindings` (`user_id`);--> statement-breakpoint
CREATE TABLE `connect_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`channel` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_connect_codes_hash` ON `connect_codes` (`code_hash`);--> statement-breakpoint
CREATE TABLE `venue_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`city` text NOT NULL,
	`name` text NOT NULL,
	`area` text,
	`capacity` integer,
	`price_band` text,
	`source` text NOT NULL,
	`url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_venue_catalog_city` ON `venue_catalog` (`city`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_venue_catalog_city_name` ON `venue_catalog` (`city`,`name`);--> statement-breakpoint
ALTER TABLE `projects` ADD `stage` text DEFAULT 'brief' NOT NULL;