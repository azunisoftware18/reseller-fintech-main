CREATE TABLE `audit_log` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`entity_type` varchar(100) NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`action` varchar(100) NOT NULL,
	`old_data` json,
	`new_data` json,
	`perform_by_user_id` varchar(36),
	`perform_by_employee_id` varchar(36),
	`ip_address` varchar(45),
	`user_agent` varchar(500),
	`tenant_id` varchar(36),
	`meta_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_number` varchar(30) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`father_name` varchar(100),
	`dob` date,
	`gender` varchar(10),
	`email` varchar(255) NOT NULL,
	`email_verified_at` timestamp,
	`mobile_number` varchar(20) NOT NULL,
	`profile_picture` varchar(255),
	`password_hash` varchar(255) NOT NULL,
	`transaction_pin_hash` varchar(255),
	`user_status` varchar(20) NOT NULL DEFAULT 'INACTIVE',
	`is_kyc_verified` boolean NOT NULL DEFAULT false,
	`is_bank_detail_verified` boolean DEFAULT false,
	`role_id` varchar(36) NOT NULL,
	`refresh_token_hash` text,
	`password_reset_token_hash` text,
	`password_reset_token_expiry` timestamp,
	`action_reason` varchar(500),
	`actioned_at` timestamp,
	`deleted_at` timestamp,
	`owner_user_id` varchar(36),
	`created_by_user_id` varchar(36),
	`created_by_employee_id` varchar(36),
	`tenant_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_user_number` UNIQUE(`user_number`),
	CONSTRAINT `uniq_user_email` UNIQUE(`tenant_id`,`email`),
	CONSTRAINT `uniq_user_mobile` UNIQUE(`tenant_id`,`mobile_number`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_number` varchar(30) NOT NULL,
	`tenant_name` varchar(255) NOT NULL,
	`tenant_legal_name` varchar(255) NOT NULL,
	`tenant_type` varchar(30) NOT NULL,
	`user_type` varchar(20) NOT NULL,
	`tenant_email` varchar(255) NOT NULL,
	`tenant_whatsapp` varchar(20) NOT NULL,
	`parent_tenant_id` varchar(36),
	`created_by_user_id` varchar(36),
	`created_by_employee_id` varchar(36),
	`tenant_status` varchar(20) NOT NULL,
	`tenant_mobile_number` varchar(20) NOT NULL,
	`action_reason` varchar(255),
	`actioned_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_tenant_number` UNIQUE(`tenant_number`),
	CONSTRAINT `uniq_tenant_whatsapp` UNIQUE(`parent_tenant_id`,`tenant_whatsapp`),
	CONSTRAINT `uniq_tenant_mobile_number` UNIQUE(`parent_tenant_id`,`tenant_mobile_number`),
	CONSTRAINT `uniq_tenant_email` UNIQUE(`parent_tenant_id`,`tenant_email`),
	CONSTRAINT `chk_tenants_user_type` CHECK(`tenants`.`user_type` IN ('AZZUNIQUE','RESELLER','WHITELABEL'))
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`role_level` int NOT NULL,
	`role_code` varchar(50) NOT NULL,
	`role_name` varchar(100) NOT NULL,
	`role_description` varchar(255),
	`tenant_id` varchar(36) NOT NULL,
	`is_system` boolean NOT NULL DEFAULT false,
	`created_by_user_id` varchar(36),
	`created_by_employee_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_role_code_tenant` UNIQUE(`tenant_id`,`role_code`),
	CONSTRAINT `uniq_role_level_tenant` UNIQUE(`tenant_id`,`role_level`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`department_code` varchar(50) NOT NULL,
	`department_name` varchar(100) NOT NULL,
	`department_description` varchar(255),
	`tenant_id` varchar(36) NOT NULL,
	`created_by_user_id` varchar(36),
	`created_by_employee_id` varchar(36),
	`updated_by_user_id` varchar(36),
	`updated_by_employee_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_dept_code_tenant` UNIQUE(`department_code`,`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`employee_number` varchar(30) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified_at` timestamp,
	`mobile_number` varchar(20) NOT NULL,
	`profile_picture` varchar(255),
	`password_hash` varchar(255) NOT NULL,
	`employee_status` varchar(20) NOT NULL DEFAULT 'INACTIVE',
	`department_id` varchar(36) NOT NULL,
	`refresh_token_hash` varchar(255),
	`password_reset_token_hash` varchar(255),
	`password_reset_token_expiry` timestamp,
	`action_reason` varchar(500),
	`actioned_at` timestamp,
	`tenant_id` varchar(36) NOT NULL,
	`created_by_user_id` varchar(36),
	`created_by_employee_id` varchar(36),
	`updated_by_user_id` varchar(36),
	`updated_by_employee_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employee_number_unique` UNIQUE(`employee_number`),
	CONSTRAINT `uniq_email_tenant` UNIQUE(`email`,`tenant_id`),
	CONSTRAINT `uniq_mobile_tenant` UNIQUE(`mobile_number`,`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`resource` varchar(100) NOT NULL,
	`action` varchar(50) NOT NULL,
	`service_code` varchar(40),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_permission_resource_action` UNIQUE(`resource`,`action`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`role_id` varchar(36) NOT NULL,
	`permission_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_role_permission` UNIQUE(`role_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`permission_id` varchar(36) NOT NULL,
	`effect` varchar(20) NOT NULL DEFAULT 'ALLOW',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_user_permission` UNIQUE(`user_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `department_permissions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`department_id` varchar(36) NOT NULL,
	`permission_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `department_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_department_permission` UNIQUE(`department_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `employee_permissions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`employee_id` varchar(36) NOT NULL,
	`permission_id` varchar(36) NOT NULL,
	`effect` varchar(10) NOT NULL DEFAULT 'ALLOW',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_employee_permission` UNIQUE(`employee_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `server_details` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`record_type` varchar(50) NOT NULL,
	`hostname` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by_user_id` varchar(36),
	`created_by_employee_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `server_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants_domains` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`domain_name` varchar(255) NOT NULL,
	`status` varchar(20) NOT NULL,
	`action_reason` varchar(255),
	`actioned_at` timestamp,
	`created_by_employee_id` varchar(36),
	`created_by_user_id` varchar(36) NOT NULL,
	`server_detail_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_tenant_domain` UNIQUE(`domain_name`)
);
--> statement-breakpoint
CREATE TABLE `tenants_websites` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`brand_name` varchar(255) NOT NULL,
	`tag_line` varchar(500),
	`logo_url` varchar(1000),
	`fav_icon_url` varchar(1000),
	`primary_color` varchar(7),
	`secondary_color` varchar(7),
	`support_email` varchar(255),
	`support_phone` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_websites_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_tenant_website` UNIQUE(`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `tenants_social_media` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_website_id` varchar(36) NOT NULL,
	`facebook_url` varchar(1000),
	`twitter_url` varchar(1000),
	`instagram_url` varchar(1000),
	`linkedin_url` varchar(1000),
	`youtube_url` varchar(1000),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_social_media_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_tenant_website_social` UNIQUE(`tenant_website_id`)
);
--> statement-breakpoint
CREATE TABLE `tenants_pages` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`page_title` varchar(255) NOT NULL,
	`page_content` text,
	`page_url` varchar(255) NOT NULL,
	`page_type` varchar(30) NOT NULL,
	`is_home_page` boolean NOT NULL DEFAULT false,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`created_by_user_id` varchar(36) NOT NULL,
	`created_by_employee_id` varchar(36),
	`source_master_page_id` varchar(36),
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_tenant_page_url` UNIQUE(`tenant_id`,`page_url`)
);
--> statement-breakpoint
CREATE TABLE `tenants_seo` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_page_id` varchar(36) NOT NULL,
	`meta_title` varchar(255) NOT NULL,
	`meta_description` varchar(1000),
	`meta_keywords` varchar(500),
	`is_indexed` boolean NOT NULL DEFAULT true,
	`is_followed` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_seo_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_tenant_page_seo` UNIQUE(`tenant_page_id`)
);
--> statement-breakpoint
CREATE TABLE `tenants_smtp_config` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`smtp_host` varchar(255) NOT NULL,
	`smtp_port` varchar(10) NOT NULL,
	`smtp_username` varchar(255) NOT NULL,
	`smtp_password` varchar(255) NOT NULL,
	`encryption_type` varchar(50),
	`from_name` varchar(255) NOT NULL,
	`from_email` varchar(255) NOT NULL,
	`created_by_user_id` varchar(36) NOT NULL,
	`created_by_employee_id` varchar(36),
	`tenant_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_smtp_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_tenant_smtp_config` UNIQUE(`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `tenants_kyc` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`submitted_by_user_id` varchar(36),
	`verified_by_user_id` varchar(36),
	`verified_by_employee_id` varchar(36),
	`actioned_at` timestamp,
	`action_reason` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_kyc_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_tenant_kyc` UNIQUE(`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `users_kyc` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`submitted_by_user_id` varchar(36),
	`submitted_at` timestamp,
	`approved_by_user_id` varchar(36),
	`approved_by_employee_id` varchar(36),
	`approved_at` timestamp,
	`approval_notes` varchar(1000),
	`rejected_by_user_id` varchar(36),
	`rejected_by_employee_id` varchar(36),
	`rejected_at` timestamp,
	`rejection_reason` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_kyc_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_user_kyc` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `kyc_documents` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_kyc_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`document_type` varchar(50) NOT NULL,
	`document_url` varchar(500) NOT NULL,
	`document_back_url` varchar(500),
	`document_number` varchar(255),
	`verification_status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`is_active` boolean NOT NULL DEFAULT true,
	`raw_response` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kyc_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pii_consent` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`purpose` varchar(255) NOT NULL,
	`consent_given` boolean NOT NULL,
	`consent_source` varchar(10) NOT NULL,
	`consent_version` varchar(50) NOT NULL,
	`consent_at` timestamp NOT NULL,
	`expire_at` timestamp,
	`consent_revoked_at` timestamp,
	`consent_revoked_reason` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pii_consent_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_pii_consent` UNIQUE(`user_id`,`tenant_id`,`purpose`,`consent_version`)
);
--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`address` text NOT NULL,
	`pin_code` varchar(10) NOT NULL,
	`state_id` varchar(36) NOT NULL,
	`city_id` varchar(36) NOT NULL,
	`address_type` varchar(20) DEFAULT 'HOME',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `states` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`state_name` varchar(255) NOT NULL,
	`state_code` varchar(10) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `states_id` PRIMARY KEY(`id`),
	CONSTRAINT `states_state_code_unique` UNIQUE(`state_code`)
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`city_name` varchar(255) NOT NULL,
	`city_code` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cities_id` PRIMARY KEY(`id`),
	CONSTRAINT `cities_city_code_unique` UNIQUE(`city_code`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`idempotency_key` varchar(255) NOT NULL,
	`txn_id` varchar(255) NOT NULL,
	`amount` bigint NOT NULL,
	`net_amount` bigint NOT NULL,
	`status` enum('PENDING','PROCESSING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`service_provider_mapping_id` varchar(36),
	`pricing` json,
	`user_id` varchar(36) NOT NULL,
	`wallet_id` varchar(36) NOT NULL,
	`api_entity_id` varchar(36) NOT NULL,
	`provider_reference` varchar(255),
	`provider_response` json,
	`initiated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`processed_at` datetime,
	`completed_at` datetime,
	`service_type` enum('RECHARGE','PAYOUT','BILL_PAYMENT','DMT') NOT NULL,
	`service_data` json,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_txn_tenant_idempotency` UNIQUE(`tenant_id`,`idempotency_key`),
	CONSTRAINT `uniq_txn_tenant_txn_id` UNIQUE(`tenant_id`,`txn_id`),
	CONSTRAINT `uniq_txn_api_entity_id` UNIQUE(`tenant_id`,`api_entity_id`)
);
--> statement-breakpoint
CREATE TABLE `api_entity` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`reference` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`service_provider_mapping_id` varchar(36),
	`status` enum('PENDING','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
	`request_payload` json,
	`provider_init_data` json,
	`provider_final_data` json,
	`error_data` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`completed_at` datetime,
	CONSTRAINT `api_entity_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_api_entity_reference` UNIQUE(`tenant_id`,`reference`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`code` varchar(40) NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_service_code` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `service_providers_mapping` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`service_id` varchar(36) NOT NULL,
	`provider_id` varchar(36) NOT NULL,
	`mode` varchar(40),
	`pricing_value_type` varchar(40),
	`provider_cost` bigint NOT NULL DEFAULT 0,
	`commission_start_level` varchar(40) NOT NULL,
	`apply_tds` boolean NOT NULL DEFAULT false,
	`tds_percent` bigint,
	`apply_gst` boolean NOT NULL DEFAULT false,
	`gst_percent` bigint,
	`support_slab` boolean NOT NULL DEFAULT false,
	`config` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_providers_mapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_provider` UNIQUE(`service_id`,`provider_id`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`code` varchar(40) NOT NULL,
	`provider_name` varchar(100) NOT NULL,
	`handler` varchar(200) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_provider_code` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `provider_slab` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`service_provider_mapping_id` varchar(36) NOT NULL,
	`min_amount` bigint NOT NULL,
	`max_amount` bigint NOT NULL,
	`provider_cost` bigint NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provider_slab_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`owner_type` varchar(10) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`wallet_type` varchar(20) NOT NULL,
	`balance` bigint NOT NULL DEFAULT 0,
	`blocked_amount` bigint NOT NULL DEFAULT 0,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_wallet_identity` UNIQUE(`tenant_id`,`owner_type`,`owner_id`,`wallet_type`)
);
--> statement-breakpoint
CREATE TABLE `ledgers` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`wallet_id` varchar(36) NOT NULL,
	`transaction_id` varchar(36),
	`refund_id` varchar(36),
	`api_entity_id` varchar(36),
	`reference` varchar(255) NOT NULL,
	`entry_type` varchar(10) NOT NULL,
	`amount` bigint NOT NULL DEFAULT 0,
	`balance_after` bigint NOT NULL DEFAULT 0,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ledgers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_ledger_tenant_reference` UNIQUE(`tenant_id`,`reference`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`transaction_id` varchar(36) NOT NULL,
	`wallet_id` varchar(36) NOT NULL,
	`refund_reference` varchar(255) NOT NULL,
	`amount` bigint NOT NULL,
	`fee_amount` bigint DEFAULT 0,
	`gst_amount` bigint DEFAULT 0,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`reason` varchar(500),
	`initiated_by_user_id` varchar(36) NOT NULL,
	`provider_refund_id` varchar(255),
	`provider_response` json,
	`initiated_at` timestamp NOT NULL DEFAULT (now()),
	`processed_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_refund_tenant_reference` UNIQUE(`tenant_id`,`refund_reference`)
);
--> statement-breakpoint
CREATE TABLE `transaction_earnings` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`wallet_id` varchar(36) NOT NULL,
	`transaction_id` varchar(36) NOT NULL,
	`service_id` varchar(36) NOT NULL,
	`mode` varchar(20) NOT NULL,
	`type` varchar(20) NOT NULL,
	`value` bigint NOT NULL,
	`base_amount` bigint NOT NULL,
	`gst_amount` bigint NOT NULL,
	`tds_amount` bigint NOT NULL DEFAULT 0,
	`final_amount` bigint NOT NULL,
	`status` varchar(20) DEFAULT 'COMPLETED',
	`applied_slab_min` bigint,
	`applied_slab_max` bigint,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_earnings_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_entry` UNIQUE(`transaction_id`,`user_id`,`mode`)
);
--> statement-breakpoint
CREATE TABLE `commission_settings` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`scope` varchar(20) NOT NULL,
	`role_id` varchar(36),
	`target_user_id` varchar(36),
	`service_provider_mapping_id` varchar(36) NOT NULL,
	`mode` varchar(20) NOT NULL,
	`type` varchar(20) NOT NULL,
	`value` bigint NOT NULL DEFAULT 0,
	`apply_tds` boolean NOT NULL DEFAULT false,
	`tds_percent` decimal(5,2) DEFAULT '0',
	`apply_gst` boolean NOT NULL DEFAULT false,
	`gst_percent` decimal(5,2) DEFAULT '0',
	`supports_slab` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by_user_id` varchar(36),
	`created_by_employee_id` varchar(36),
	`updated_by_user_id` varchar(36),
	`updated_by_employee_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commission_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `cs_role_rule_uniq` UNIQUE(`tenant_id`,`service_provider_mapping_id`,`role_id`,`mode`),
	CONSTRAINT `cs_user_rule_uniq` UNIQUE(`tenant_id`,`service_provider_mapping_id`,`target_user_id`,`mode`)
);
--> statement-breakpoint
CREATE TABLE `commission_setting_slabs` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`commission_setting_id` varchar(36) NOT NULL,
	`min_amount` bigint NOT NULL,
	`max_amount` bigint NOT NULL,
	`value` bigint NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commission_setting_slabs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_snapshots` (
	`id` varchar(36) NOT NULL,
	`wallet_id` varchar(36) NOT NULL,
	`balance` int NOT NULL,
	`blocked_amount` int NOT NULL,
	`snapshot_date` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mail_queue` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`recipient_email` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`html` text NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`attempts` int NOT NULL DEFAULT 0,
	`next_attempt_at` timestamp NOT NULL DEFAULT (now()),
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mail_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recharge_operator_map` (
	`id` varchar(36) NOT NULL,
	`service_provider_mapping_id` varchar(36) NOT NULL,
	`internal_operator_code` varchar(20) NOT NULL,
	`provider_operator_code` varchar(20) NOT NULL,
	`direction` varchar(20) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `recharge_operator_map_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_rom_int_ps_feat_prov_dir` UNIQUE(`internal_operator_code`,`service_provider_mapping_id`,`direction`)
);
--> statement-breakpoint
CREATE TABLE `recharge_circle_map` (
	`id` varchar(36) NOT NULL,
	`service_provider_mapping_id` varchar(36) NOT NULL,
	`internal_circle_code` varchar(20) NOT NULL,
	`provider_circle_code` varchar(20) NOT NULL,
	`direction` varchar(20) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `recharge_circle_map_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_circle_map_dir` UNIQUE(`service_provider_mapping_id`,`internal_circle_code`,`direction`)
);
--> statement-breakpoint
CREATE TABLE `banks` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`bank_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`ifsc_alias` varchar(50) NOT NULL,
	`ifsc_global` varchar(50) NOT NULL,
	`rtgs_enabled` boolean NOT NULL DEFAULT false,
	`rtgs_failure_rate` varchar(10) NOT NULL DEFAULT '0',
	`neft_enabled` boolean NOT NULL DEFAULT false,
	`neft_failure_rate` varchar(10) NOT NULL DEFAULT '0',
	`imps_enabled` boolean NOT NULL DEFAULT false,
	`imps_failure_rate` varchar(10) NOT NULL DEFAULT '0',
	`upi_enabled` boolean NOT NULL DEFAULT false,
	`upi_failure_rate` varchar(10) NOT NULL DEFAULT '0',
	`visa_direct_credit` varchar(50) NOT NULL DEFAULT 'INACTIVE',
	`visa_direct_debit` varchar(50) NOT NULL DEFAULT 'INACTIVE',
	`mastercard_send_credit` varchar(50) NOT NULL DEFAULT 'INACTIVE',
	`mastercard_send_debit` varchar(50) NOT NULL DEFAULT 'INACTIVE',
	`credit_card_upi` boolean NOT NULL DEFAULT false,
	`credit_card_imps` boolean NOT NULL DEFAULT false,
	`credit_card_neft` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `banks_id` PRIMARY KEY(`id`),
	CONSTRAINT `banks_bank_id_unique` UNIQUE(`bank_id`)
);
--> statement-breakpoint
CREATE TABLE `user_bank_detail` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`tenant_id` varchar(36) NOT NULL,
	`bank_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`bank_name` varchar(255) NOT NULL,
	`account_holder_name` varchar(255) NOT NULL,
	`account_number` varchar(255) NOT NULL,
	`ifsc_code` varchar(255) NOT NULL,
	`branch_name` varchar(255) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`verification_status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`submitted_by_user_id` varchar(36),
	`submitted_at` timestamp,
	`approved_by_user_id` varchar(36),
	`approved_by_employee_id` varchar(36),
	`approved_at` timestamp,
	`approval_notes` varchar(1000),
	`rejected_by_user_id` varchar(36),
	`rejected_by_employee_id` varchar(36),
	`rejected_at` timestamp,
	`rejection_reason` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `user_bank_detail_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_bank_detail` UNIQUE(`user_id`,`account_number`)
);
--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_user_fk` FOREIGN KEY (`perform_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `user_role_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `user_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `user_owner_fk` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `user_created_by_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants` ADD CONSTRAINT `tenant_parent_fk` FOREIGN KEY (`parent_tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants` ADD CONSTRAINT `tenant_created_by_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roles` ADD CONSTRAINT `role_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roles` ADD CONSTRAINT `role_created_by_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roles` ADD CONSTRAINT `role_created_by_employee_fk` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `dept_created_by_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `dept_created_by_employee_fk` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `dept_updated_by_user_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `dept_updated_by_employee_fk` FOREIGN KEY (`updated_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `dept_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `emp_department_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `emp_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `cs_created_by_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `cs_created_by_employee_fk` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `cs_updated_by_user_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `cs_updated_by_employee_fk` FOREIGN KEY (`updated_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `rp_role_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `rp_permission_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `up_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `up_permission_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `department_permissions` ADD CONSTRAINT `dp_department_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `department_permissions` ADD CONSTRAINT `dp_permission_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_permissions` ADD CONSTRAINT `ep_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_permissions` ADD CONSTRAINT `ep_permission_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `server_details` ADD CONSTRAINT `server_created_by_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `server_details` ADD CONSTRAINT `server_tenant_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_domains` ADD CONSTRAINT `td_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_domains` ADD CONSTRAINT `td_created_by_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_domains` ADD CONSTRAINT `td_server_detail_fk` FOREIGN KEY (`server_detail_id`) REFERENCES `server_details`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_websites` ADD CONSTRAINT `tw_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_social_media` ADD CONSTRAINT `tsm_website_fk` FOREIGN KEY (`tenant_website_id`) REFERENCES `tenants_websites`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_pages` ADD CONSTRAINT `tp_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_pages` ADD CONSTRAINT `tp_created_by_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_seo` ADD CONSTRAINT `tseo_page_fk` FOREIGN KEY (`tenant_page_id`) REFERENCES `tenants_pages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_smtp_config` ADD CONSTRAINT `smtp_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_smtp_config` ADD CONSTRAINT `smtp_created_by_user_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_kyc` ADD CONSTRAINT `tk_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_kyc` ADD CONSTRAINT `tk_submitted_by_user_fk` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants_kyc` ADD CONSTRAINT `tk_verified_by_user_fk` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_kyc` ADD CONSTRAINT `uk_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_kyc` ADD CONSTRAINT `uk_submitted_by_user_fk` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_kyc` ADD CONSTRAINT `uk_approved_by_user_fk` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_kyc` ADD CONSTRAINT `uk_approved_by_employee_fk` FOREIGN KEY (`approved_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_kyc` ADD CONSTRAINT `uk_rejected_by_user_fk` FOREIGN KEY (`rejected_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_kyc` ADD CONSTRAINT `uk_rejected_by_employee_fk` FOREIGN KEY (`rejected_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_documents` ADD CONSTRAINT `doc_user_kyc_fk` FOREIGN KEY (`user_kyc_id`) REFERENCES `users_kyc`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_documents` ADD CONSTRAINT `doc_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pii_consent` ADD CONSTRAINT `pii_consent_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pii_consent` ADD CONSTRAINT `pii_consent_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `addresses` ADD CONSTRAINT `ua_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `addresses` ADD CONSTRAINT `ua_state_fk` FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `addresses` ADD CONSTRAINT `ua_city_fk` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `txn_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `txn_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `txn_wallet_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `txn_api_entity_fk` FOREIGN KEY (`api_entity_id`) REFERENCES `api_entity`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `txn_sp_mapping_fk` FOREIGN KEY (`service_provider_mapping_id`) REFERENCES `service_providers_mapping`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_entity` ADD CONSTRAINT `api_entity_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_entity` ADD CONSTRAINT `api_entity_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_entity` ADD CONSTRAINT `api_entity_sp_mapping_fk` FOREIGN KEY (`service_provider_mapping_id`) REFERENCES `service_providers_mapping`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_providers_mapping` ADD CONSTRAINT `service_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_providers_mapping` ADD CONSTRAINT `provider_fk` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `provider_slab` ADD CONSTRAINT `service_provider_mapping_fk` FOREIGN KEY (`service_provider_mapping_id`) REFERENCES `service_providers_mapping`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ledgers` ADD CONSTRAINT `ledger_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ledgers` ADD CONSTRAINT `ledger_wallet_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ledgers` ADD CONSTRAINT `ledger_tx_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ledgers` ADD CONSTRAINT `ledger_refund_fk` FOREIGN KEY (`refund_id`) REFERENCES `refunds`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refunds` ADD CONSTRAINT `refund_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refunds` ADD CONSTRAINT `refund_transaction_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refunds` ADD CONSTRAINT `refund_wallet_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refunds` ADD CONSTRAINT `refund_initiated_by_user_fk` FOREIGN KEY (`initiated_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_earnings` ADD CONSTRAINT `te_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_earnings` ADD CONSTRAINT `te_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_earnings` ADD CONSTRAINT `te_wallet_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_earnings` ADD CONSTRAINT `te_tx_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_earnings` ADD CONSTRAINT `te_service_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_settings` ADD CONSTRAINT `cs_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_settings` ADD CONSTRAINT `cs_service_fk` FOREIGN KEY (`service_provider_mapping_id`) REFERENCES `service_providers_mapping`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_settings` ADD CONSTRAINT `cs_role_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_settings` ADD CONSTRAINT `cs_user_fk` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_settings` ADD CONSTRAINT `cs_created_by_user_fk_v1` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_settings` ADD CONSTRAINT `cs_created_by_employee_fk_v1` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_settings` ADD CONSTRAINT `cs_updated_by_user_fk_v2` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_settings` ADD CONSTRAINT `cs_updated_by_employee_fk_v2` FOREIGN KEY (`updated_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commission_setting_slabs` ADD CONSTRAINT `fk_commission_slab_commission_setting` FOREIGN KEY (`commission_setting_id`) REFERENCES `commission_settings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_snapshots` ADD CONSTRAINT `wallet_snapshots_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mail_queue` ADD CONSTRAINT `mail_queue_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_bank_detail` ADD CONSTRAINT `bd_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_bank_detail` ADD CONSTRAINT `bd_bank_fk` FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_bank_detail` ADD CONSTRAINT `bd_submitted_by_user_fk` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_bank_detail` ADD CONSTRAINT `bd_approved_by_user_fk` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_bank_detail` ADD CONSTRAINT `bd_approved_by_employee_fk` FOREIGN KEY (`approved_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_bank_detail` ADD CONSTRAINT `bd_rejected_by_user_fk` FOREIGN KEY (`rejected_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_bank_detail` ADD CONSTRAINT `bd_rejected_by_employee_fk` FOREIGN KEY (`rejected_by_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_bank_detail` ADD CONSTRAINT `bd_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_user_tenant_status` ON `users` (`tenant_id`,`user_status`);--> statement-breakpoint
CREATE INDEX `idx_user_owner` ON `users` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_parent` ON `tenants` (`parent_tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_status` ON `tenants` (`tenant_status`);--> statement-breakpoint
CREATE INDEX `idx_role_tenant_level` ON `roles` (`tenant_id`,`role_level`);--> statement-breakpoint
CREATE INDEX `idx_role_tenant` ON `roles` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_emp_tenant_status` ON `employees` (`tenant_id`,`employee_status`);--> statement-breakpoint
CREATE INDEX `idx_emp_department` ON `employees` (`department_id`);--> statement-breakpoint
CREATE INDEX `idx_permission_service_code` ON `permissions` (`service_code`);--> statement-breakpoint
CREATE INDEX `idx_server_hostname_status` ON `server_details` (`hostname`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tenant_domain_tenant` ON `tenants_domains` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_tenant_domain_status` ON `tenants_domains` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tenant_page_type` ON `tenants_pages` (`page_type`);--> statement-breakpoint
CREATE INDEX `idx_tenant_pages_status` ON `tenants_pages` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tenant_kyc_status` ON `tenants_kyc` (`status`);--> statement-breakpoint
CREATE INDEX `idx_user_kyc_status` ON `users_kyc` (`status`);--> statement-breakpoint
CREATE INDEX `idx_user_kyc_submitted_at` ON `users_kyc` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `idx_user_kyc` ON `kyc_documents` (`user_kyc_id`);--> statement-breakpoint
CREATE INDEX `idx_user` ON `kyc_documents` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_doc_type` ON `kyc_documents` (`document_type`);--> statement-breakpoint
CREATE INDEX `idx_active` ON `kyc_documents` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_pii_consent_user` ON `pii_consent` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_pii_consent_tenant` ON `pii_consent` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_ua_user` ON `addresses` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ua_active` ON `addresses` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_state_code` ON `states` (`state_code`);--> statement-breakpoint
CREATE INDEX `idx_city_code` ON `cities` (`city_code`);--> statement-breakpoint
CREATE INDEX `idx_txn_tenant_id` ON `transactions` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_txn_user_status` ON `transactions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_txn_status_initiated` ON `transactions` (`status`,`initiated_at`);--> statement-breakpoint
CREATE INDEX `idx_txn_tenant_status` ON `transactions` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_txn_tenant_service_type` ON `transactions` (`tenant_id`,`service_type`);--> statement-breakpoint
CREATE INDEX `idx_txn_tenant_created` ON `transactions` (`tenant_id`,`initiated_at`);--> statement-breakpoint
CREATE INDEX `idx_api_entity_tenant_id` ON `api_entity` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_api_entity_user_id` ON `api_entity` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_api_entity_status_created` ON `api_entity` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_api_entity_tenant_status` ON `api_entity` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_provider_active` ON `providers` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_provider_active` ON `provider_slab` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_wallet_tenant` ON `wallets` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_wallet_owner` ON `wallets` (`owner_type`,`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_ledger_api_entity` ON `ledgers` (`api_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_ledger_wallet_created` ON `ledgers` (`wallet_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ledger_transaction` ON `ledgers` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_ledger_tenant_created` ON `ledgers` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ledger_entry_type` ON `ledgers` (`tenant_id`,`entry_type`);--> statement-breakpoint
CREATE INDEX `idx_refund_transaction` ON `refunds` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_refund_tenant_status` ON `refunds` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_refund_wallet` ON `refunds` (`wallet_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_refund_created` ON `refunds` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_te_tenant` ON `transaction_earnings` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_te_user` ON `transaction_earnings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_te_transaction` ON `transaction_earnings` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_te_mode` ON `transaction_earnings` (`mode`);--> statement-breakpoint
CREATE INDEX `idx_te_status` ON `transaction_earnings` (`status`);--> statement-breakpoint
CREATE INDEX `idx_te_created_at` ON `transaction_earnings` (`created_at`);--> statement-breakpoint
CREATE INDEX `cs_resolve_idx` ON `commission_settings` (`tenant_id`,`scope`,`role_id`,`target_user_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_commission_slab_is_active` ON `commission_setting_slabs` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_wallet_snapshots_wallet` ON `wallet_snapshots` (`wallet_id`);--> statement-breakpoint
CREATE INDEX `idx_mail_status_retry` ON `mail_queue` (`status`,`next_attempt_at`);--> statement-breakpoint
CREATE INDEX `idx_bank_detail_verification_status` ON `user_bank_detail` (`verification_status`);--> statement-breakpoint
CREATE INDEX `idx_bank_detail_submitted_at` ON `user_bank_detail` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `idx_bank_detail_is_primary` ON `user_bank_detail` (`is_primary`);