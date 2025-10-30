-- CreateTable
CREATE TABLE `_StatusSpecificViewers` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_StatusSpecificViewers_AB_unique`(`A`, `B`),
    INDEX `_StatusSpecificViewers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_StatusSpecificViewers` ADD CONSTRAINT `_StatusSpecificViewers_A_fkey` FOREIGN KEY (`A`) REFERENCES `Status`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_StatusSpecificViewers` ADD CONSTRAINT `_StatusSpecificViewers_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Status` RENAME INDEX `Status_user_id_fkey` TO `Status_user_id_idx`;
