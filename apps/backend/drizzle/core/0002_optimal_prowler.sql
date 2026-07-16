ALTER TABLE `ledgers` MODIFY COLUMN `entry_type` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `ledgers` ADD `blocked_after` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ledgers` ADD `available_after` bigint DEFAULT 0 NOT NULL;