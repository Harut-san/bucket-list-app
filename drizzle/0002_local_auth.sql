ALTER TABLE `users` ADD `passwordHash` varchar(255) NOT NULL DEFAULT '$2b$12$4A6HDWUaL5i6l7V9fJvW0uCrVt2V8R38UhMyl2B8tQ2N8CoqYj9gq';
--> statement-breakpoint
UPDATE `users`
SET `email` = CONCAT('legacy_user_', `id`, '@example.local')
WHERE `email` IS NULL OR `email` = '';
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);
--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `openId`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;
--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN `passwordHash` DROP DEFAULT;
