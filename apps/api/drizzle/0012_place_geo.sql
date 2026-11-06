CREATE TABLE `place_cache` (
	`cell` text NOT NULL,
	`category` text NOT NULL,
	`radius_m` integer NOT NULL,
	`payload` text NOT NULL,
	`source` text NOT NULL,
	`provider_run_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`stale` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`cell`, `category`)
);
--> statement-breakpoint
CREATE TABLE `provider_budget` (
	`provider` text NOT NULL,
	`day` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`provider`, `day`)
);
--> statement-breakpoint
CREATE TABLE `provider_circuit` (
	`provider` text PRIMARY KEY NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`opened_at` integer,
	`state` text DEFAULT 'closed' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `search_cache` ADD `payload` text;--> statement-breakpoint
ALTER TABLE `search_cache` ADD `kind` text;--> statement-breakpoint
ALTER TABLE `search_cache` ADD `expires_at` integer;--> statement-breakpoint
ALTER TABLE `search_cache` ADD `degraded` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `latitude` real;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `longitude` real;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `provider` text;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `opening_hours` text;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `contact_source` text;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `rating` real;--> statement-breakpoint
ALTER TABLE `venue_catalog` ADD `last_verified_at` integer;--> statement-breakpoint
CREATE INDEX `idx_venue_catalog_geo` ON `venue_catalog` (`city`,`latitude`,`longitude`);