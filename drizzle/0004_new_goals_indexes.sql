CREATE INDEX `bucket_items_createdAt_idx` ON `bucket_items` (`createdAt`);
CREATE INDEX `bucket_items_title_category_createdAt_idx` ON `bucket_items` (`title`, `category`, `createdAt`);
CREATE INDEX `bucket_items_category_createdAt_idx` ON `bucket_items` (`category`, `createdAt`);
CREATE INDEX `bucket_items_userId_createdAt_idx` ON `bucket_items` (`userId`, `createdAt`);
