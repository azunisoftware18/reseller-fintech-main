ALTER TABLE `transactions` ADD `last_status_check_at` datetime;--> statement-breakpoint
CREATE INDEX `idx_txn_last_status_check` ON `transactions` (`last_status_check_at`);