CREATE TABLE `frame_schedule` (
	`frame_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`widget` text NOT NULL,
	`config` text NOT NULL,
	`last_pushed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`frame_id`) REFERENCES `frame`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `github_integration` (
	`user_id` text PRIMARY KEY NOT NULL,
	`login` text NOT NULL,
	`secret` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
