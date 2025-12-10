DROP INDEX `activities_crop_date_idx`;--> statement-breakpoint
ALTER TABLE `activities` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `activities_user_crop_date_idx` ON `activities` (`user_id`,`crop_id`,`performed_on`);--> statement-breakpoint
DROP INDEX `crops_field_season_idx`;--> statement-breakpoint
ALTER TABLE `crops` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `crops_user_field_season_idx` ON `crops` (`user_id`,`field_id`,`season`);--> statement-breakpoint
DROP INDEX `harvests_crop_date_idx`;--> statement-breakpoint
ALTER TABLE `harvests` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `harvests_user_crop_date_idx` ON `harvests` (`user_id`,`crop_id`,`harvested_on`);--> statement-breakpoint
DROP INDEX `sales_harvest_date_idx`;--> statement-breakpoint
ALTER TABLE `sales` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `sales_user_harvest_date_idx` ON `sales` (`user_id`,`harvest_id`,`sold_on`);