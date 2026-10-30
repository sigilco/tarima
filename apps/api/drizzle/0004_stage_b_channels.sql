CREATE TABLE `user_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text,
	`kind` text NOT NULL,
	`summary` text NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_messages_user` ON `user_messages` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_user_messages_unread` ON `user_messages` (`user_id`,`read_at`);