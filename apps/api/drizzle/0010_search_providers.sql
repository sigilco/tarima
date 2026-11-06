CREATE TABLE `provider_ledger` (
	`day` text NOT NULL,
	`provider` text NOT NULL,
	`bucket` text NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `provider`, `bucket`)
);
