-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `StatusLike` DROP FOREIGN KEY `StatusLike_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `StatusPrivacySetting` DROP FOREIGN KEY `StatusPrivacySetting_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `StatusView` DROP FOREIGN KEY `StatusView_status_id_fkey`;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `Status`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StatusLike` ADD CONSTRAINT `StatusLike_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `Status`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StatusView` ADD CONSTRAINT `StatusView_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `Status`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StatusPrivacySetting` ADD CONSTRAINT `StatusPrivacySetting_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `Status`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
