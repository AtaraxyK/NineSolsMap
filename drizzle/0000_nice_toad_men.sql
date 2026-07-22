CREATE TABLE `progress` (
	`marker_id` text PRIMARY KEY NOT NULL,
	`completed` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
