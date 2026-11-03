CREATE TABLE `room_share_links` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`room_id` text,
	`token` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	`revoked_at` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`last_viewed_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_room_share_links_token` ON `room_share_links` (`token`);
--> statement-breakpoint
CREATE INDEX `idx_room_share_links_project` ON `room_share_links` (`project_id`);
