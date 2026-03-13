CREATE TABLE IF NOT EXISTS `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`author` text NOT NULL,
	`tags` text,
	`date` text,
	`content` text NOT NULL,
	`last_updated` integer NOT NULL,
	`saved_at` integer,
	`url` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `favorites_url_unique` ON `favorites` (`url`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`excerpt` text,
	`tags` text NOT NULL,
	`author` text NOT NULL,
	`author_avatar` text NOT NULL,
	`sidebar_style` text NOT NULL,
	`html` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `posts_url_unique` ON `posts` (`url`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `trash` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`excerpt` text,
	`tags` text NOT NULL,
	`author` text NOT NULL,
	`author_avatar` text NOT NULL,
	`sidebar_style` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);