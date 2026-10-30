CREATE TABLE `search_cache` (
	`query_hash` text PRIMARY KEY NOT NULL,
	`query` text NOT NULL,
	`venue_ids` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`refreshed_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `external_id` text;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `contact_email` text;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `contact_phone` text;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `website` text;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `enriched_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_venue_catalog_external` ON `venue_catalog` (`external_id`);