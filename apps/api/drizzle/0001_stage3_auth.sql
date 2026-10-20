CREATE TABLE `otp_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code_hash` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_otp_email` ON `otp_codes` (`email`);--> statement-breakpoint
CREATE INDEX `idx_otp_email_unconsumed` ON `otp_codes` (`email`,`consumed_at`);