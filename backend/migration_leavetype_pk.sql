-- Manual migration to change LeaveType primary key from id to leaveTypeCode
-- This migration preserves existing data

-- Step 1: Add leaveTypeCode column to leave_types and populate from code
ALTER TABLE `leave_types` ADD COLUMN `leaveTypeCode` VARCHAR(191) NULL;
UPDATE `leave_types` SET `leaveTypeCode` = `code`;
ALTER TABLE `leave_types` MODIFY `leaveTypeCode` VARCHAR(191) NOT NULL;

-- Step 2: Add leaveTypeCode to leave_balances and populate from existing relationship
ALTER TABLE `leave_balances` ADD COLUMN `leaveTypeCode` VARCHAR(191) NULL;
UPDATE `leave_balances` lb
INNER JOIN `leave_types` lt ON lb.`leaveTypeId` = lt.`id`
SET lb.`leaveTypeCode` = lt.`leaveTypeCode`;
ALTER TABLE `leave_balances` MODIFY `leaveTypeCode` VARCHAR(191) NOT NULL;

-- Step 3: Add leaveTypeCode to leave_requests and populate from existing relationship
ALTER TABLE `leave_requests` ADD COLUMN `leaveTypeCode` VARCHAR(191) NULL;
UPDATE `leave_requests` lr
INNER JOIN `leave_types` lt ON lr.`leaveTypeId` = lt.`id`
SET lr.`leaveTypeCode` = lt.`leaveTypeCode`;
ALTER TABLE `leave_requests` MODIFY `leaveTypeCode` VARCHAR(191) NOT NULL;

-- Step 4: Add leaveTypeCode to monthly_accruals and populate from existing relationship
ALTER TABLE `monthly_accruals` ADD COLUMN `leaveTypeCode` VARCHAR(191) NULL;
UPDATE `monthly_accruals` ma
INNER JOIN `leave_types` lt ON ma.`leaveTypeId` = lt.`id`
SET ma.`leaveTypeCode` = lt.`leaveTypeCode`;
ALTER TABLE `monthly_accruals` MODIFY `leaveTypeCode` VARCHAR(191) NOT NULL;

-- Step 5: Update leave_process_history (no FK, just rename column)
ALTER TABLE `leave_process_history` CHANGE COLUMN `leaveTypeId` `leaveTypeCode` VARCHAR(191) NOT NULL;

-- Step 6: Drop foreign key constraints
ALTER TABLE `leave_balances` DROP FOREIGN KEY `leave_balances_leaveTypeId_fkey`;
ALTER TABLE `leave_requests` DROP FOREIGN KEY `leave_requests_leaveTypeId_fkey`;
ALTER TABLE `monthly_accruals` DROP FOREIGN KEY `monthly_accruals_leaveTypeId_fkey`;

-- Step 7: Drop old indexes
ALTER TABLE `leave_balances` DROP INDEX `leave_balances_leaveTypeId_idx`;
ALTER TABLE `leave_requests` DROP INDEX `leave_requests_leaveTypeId_idx`;
ALTER TABLE `monthly_accruals` DROP INDEX `monthly_accruals_leaveTypeId_idx`;

-- Step 8: Drop unique constraints that include leaveTypeId
ALTER TABLE `leave_balances` DROP INDEX `leave_balances_employeeId_leaveTypeId_year_key`;
ALTER TABLE `monthly_accruals` DROP INDEX `monthly_accruals_employeeId_leaveTypeId_year_month_key`;

-- Step 9: Drop old leaveTypeId columns
ALTER TABLE `leave_balances` DROP COLUMN `leaveTypeId`;
ALTER TABLE `leave_requests` DROP COLUMN `leaveTypeId`;
ALTER TABLE `monthly_accruals` DROP COLUMN `leaveTypeId`;

-- Step 10: Drop PRIMARY KEY and unique constraint on leave_types
ALTER TABLE `leave_types` DROP PRIMARY KEY;
ALTER TABLE `leave_types` DROP INDEX `leave_types_code_key`;

-- Step 11: Drop old id and code columns from leave_types
ALTER TABLE `leave_types` DROP COLUMN `id`;
ALTER TABLE `leave_types` DROP COLUMN `code`;

-- Step 12: Make leaveTypeCode the primary key
ALTER TABLE `leave_types` ADD PRIMARY KEY (`leaveTypeCode`);

-- Step 13: Create new indexes
ALTER TABLE `leave_balances` ADD INDEX `leave_balances_leaveTypeCode_idx` (`leaveTypeCode`);
ALTER TABLE `leave_requests` ADD INDEX `leave_requests_leaveTypeCode_idx` (`leaveTypeCode`);
ALTER TABLE `monthly_accruals` ADD INDEX `monthly_accruals_leaveTypeCode_idx` (`leaveTypeCode`);

-- Step 14: Recreate unique constraints
ALTER TABLE `leave_balances` ADD UNIQUE KEY `leave_balances_employeeId_leaveTypeCode_year_key` (`employeeId`, `leaveTypeCode`, `year`);
ALTER TABLE `monthly_accruals` ADD UNIQUE KEY `monthly_accruals_employeeId_leaveTypeCode_year_month_key` (`employeeId`, `leaveTypeCode`, `year`, `month`);

-- Step 15: Add foreign key constraints with new primary key
ALTER TABLE `leave_balances`
  ADD CONSTRAINT `leave_balances_leaveTypeCode_fkey`
  FOREIGN KEY (`leaveTypeCode`)
  REFERENCES `leave_types`(`leaveTypeCode`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_leaveTypeCode_fkey`
  FOREIGN KEY (`leaveTypeCode`)
  REFERENCES `leave_types`(`leaveTypeCode`)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE `monthly_accruals`
  ADD CONSTRAINT `monthly_accruals_leaveTypeCode_fkey`
  FOREIGN KEY (`leaveTypeCode`)
  REFERENCES `leave_types`(`leaveTypeCode`)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
