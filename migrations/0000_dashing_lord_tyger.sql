CREATE TABLE `certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`issuer` text NOT NULL,
	`date` text NOT NULL,
	`credential_id` text,
	`link` text
);
--> statement-breakpoint
CREATE TABLE `educations` (
	`id` text PRIMARY KEY NOT NULL,
	`school_name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`degree_name` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`activities` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`work_start` text NOT NULL,
	`work_end` text,
	`location` text NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`works` text DEFAULT '[]' NOT NULL,
	`gradient` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`headline` text NOT NULL,
	`summary` text NOT NULL,
	`industry` text,
	`location` text,
	`birth_date` text,
	`website` text,
	`twitter_handles` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skill_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`icon` text NOT NULL,
	`skills` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skill_categories_title_unique` ON `skill_categories` (`title`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description_short` text NOT NULL,
	`description_long` text NOT NULL,
	`icon` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`app_store_id` text,
	`play_store_id` text,
	`is_internal` integer DEFAULT 0 NOT NULL,
	`featured` integer DEFAULT 0 NOT NULL,
	`company_id` text,
	`technologies` text DEFAULT '[]' NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`screenshots` text DEFAULT '[]' NOT NULL,
	`web_urls` text,
	`source_code` text,
	`google_group_url` text
);
