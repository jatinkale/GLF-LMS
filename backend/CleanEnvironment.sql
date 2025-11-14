-- =====================================================
-- CleanEnvironment.sql
-- LMS v2 - Leave Management System
--
-- Purpose: Clean up all data from the database while
--          keeping the admin login intact
--
-- CAUTION: This script will DELETE all data except:
--          - Admin user (ADMIN)
--          - LeaveType configurations
--          - Department master data
--
-- Usage: Run this script in MySQL Workbench or via CLI
--        mysql -u username -p database_name < CleanEnvironment.sql
--
-- Date: November 13, 2025
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- SECTION 1: Clean up dependent tables first
-- =====================================================

-- 1. Delete Notifications
DELETE FROM Notification;
ALTER TABLE Notification AUTO_INCREMENT = 1;
SELECT 'Deleted all Notifications' AS Status;

-- 2. Delete Notification Preferences
DELETE FROM NotificationPreference;
ALTER TABLE NotificationPreference AUTO_INCREMENT = 1;
SELECT 'Deleted all Notification Preferences' AS Status;

-- 3. Delete Delegations
DELETE FROM Delegation;
ALTER TABLE Delegation AUTO_INCREMENT = 1;
SELECT 'Deleted all Delegations' AS Status;

-- 4. Delete Leave Templates (User-created templates)
-- Uncomment the next 3 lines if you want to delete user leave templates
-- DELETE FROM LeaveTemplate;
-- ALTER TABLE LeaveTemplate AUTO_INCREMENT = 1;
-- SELECT 'Deleted all Leave Templates' AS Status;

SELECT 'Kept Leave Templates intact' AS Status;

-- 5. Delete Leave Modification Requests
DELETE FROM LeaveModificationRequest;
ALTER TABLE LeaveModificationRequest AUTO_INCREMENT = 1;
SELECT 'Deleted all Leave Modification Requests' AS Status;

-- 6. Delete Leave Cancellation Requests
DELETE FROM LeaveCancellationRequest;
ALTER TABLE LeaveCancellationRequest AUTO_INCREMENT = 1;
SELECT 'Deleted all Leave Cancellation Requests' AS Status;

-- 7. Delete Approvals
DELETE FROM Approval;
ALTER TABLE Approval AUTO_INCREMENT = 1;
SELECT 'Deleted all Approvals' AS Status;

-- 8. Delete Leave Requests
DELETE FROM LeaveRequest;
ALTER TABLE LeaveRequest AUTO_INCREMENT = 1;
SELECT 'Deleted all Leave Requests' AS Status;

-- 9. Delete Leave Balances (except for Admin)
DELETE FROM LeaveBalance WHERE employeeId != 'ADMIN';
SELECT 'Deleted all Leave Balances except Admin' AS Status;

-- 10. Delete Monthly Accruals (except for Admin)
DELETE FROM MonthlyAccrual WHERE employeeId != 'ADMIN';
SELECT 'Deleted all Monthly Accruals except Admin' AS Status;

-- 11. Delete Comp Off Work Logs
DELETE FROM CompOffWorkLog;
ALTER TABLE CompOffWorkLog AUTO_INCREMENT = 1;
SELECT 'Deleted all Comp Off Work Logs' AS Status;

-- 12. Delete Comp Off Requests
DELETE FROM CompOffRequest;
ALTER TABLE CompOffRequest AUTO_INCREMENT = 1;
SELECT 'Deleted all Comp Off Requests' AS Status;

-- 13. Delete Comp Off Balances (except for Admin)
DELETE FROM CompOffBalance WHERE employeeId != 'ADMIN';
SELECT 'Deleted all Comp Off Balances except Admin' AS Status;

-- =====================================================
-- SECTION 2: Clean up audit and history tables
-- =====================================================

-- 14. Delete Audit Logs
-- Option A: Delete ALL audit logs (clean slate)
-- DELETE FROM AuditLog;
-- ALTER TABLE AuditLog AUTO_INCREMENT = 1;
-- SELECT 'Deleted ALL Audit Logs' AS Status;

-- Option B: Keep Admin's audit logs (currently active)
DELETE FROM AuditLog WHERE performedBy != 'ADMIN';
ALTER TABLE AuditLog AUTO_INCREMENT = 1;
SELECT 'Deleted all Audit Logs except Admin actions' AS Status;

-- Option C: Keep ALL audit logs (uncomment below and comment Option B)
-- SELECT 'Kept all Audit Logs intact' AS Status;

-- 15. Delete Leave Process History
DELETE FROM LeaveProcessHistory;
ALTER TABLE LeaveProcessHistory AUTO_INCREMENT = 1;
SELECT 'Deleted all Leave Process History' AS Status;

-- =====================================================
-- SECTION 3: Clean up Holiday records (User Data)
-- =====================================================

-- 16. Delete Holiday Records (admin-added holiday data)
-- This deletes the actual holiday records (e.g., "Christmas 2024", "Diwali 2024")
-- The Holiday table structure and configuration logic remains intact
DELETE FROM Holiday;
ALTER TABLE Holiday AUTO_INCREMENT = 1;
SELECT 'Deleted all Holiday records (admin-added data)' AS Status;

-- NOTE: Holiday table structure, relationships, and business logic are preserved
-- Comment out the DELETE above if you want to keep the holiday records

-- =====================================================
-- SECTION 4: Clean up Employee and User data
-- =====================================================

-- 17. Delete Employees (except Admin if exists)
DELETE FROM Employee WHERE employeeId != 'ADMIN';
SELECT 'Deleted all Employees except Admin' AS Status;

-- 18. Delete Users (except Admin)
DELETE FROM User WHERE employeeId != 'ADMIN' AND role != 'ADMIN';
SELECT 'Deleted all Users except Admin' AS Status;

-- =====================================================
-- SECTION 5: Reference & Configuration Data (KEPT)
-- =====================================================

-- The following tables/structures are PRESERVED:
-- 1. Department - Master Data (organizational structure)
-- 2. LeaveType - Leave type configurations (CL, PL, ML, PTL, etc.)
-- 3. Holiday TABLE STRUCTURE - The table and its logic remain (records deleted)
-- 4. LeaveTemplate - System/User leave templates (optional)
--
-- NOTE: Enums are defined in Prisma schema and don't need cleanup:
--       - Role, Gender, LeaveStatus, ApprovalStatus, LeaveCategory,
--       - Region, AccrualFrequency, NotificationType, CompOffStatus,
--       - LMSAccess, EmployeeType
--
-- NOTE: Database schema, table structures, relationships, and all business
--       logic remain intact. Only transactional/user-added data is removed.

SELECT 'Kept all Reference and Configuration data intact' AS Status;
SELECT '  - Departments (Master Data)' AS '';
SELECT '  - LeaveTypes (Configuration)' AS '';
SELECT '  - Holiday table structure & logic (records deleted)' AS '';
SELECT '  - LeaveTemplates (Optional)' AS '';
SELECT '  - All table structures and relationships' AS '';
SELECT '  - All business logic and validations' AS '';
SELECT '  - All Enums (defined in schema)' AS '';

-- =====================================================
-- SECTION 6: Reset Admin User Status
-- =====================================================

-- Ensure Admin user is active
UPDATE User
SET isActive = true,
    emailVerified = true
WHERE role = 'ADMIN' OR employeeId = 'ADMIN';

SELECT 'Admin user status reset to active' AS Status;

-- =====================================================
-- SECTION 7: Verification
-- =====================================================

-- Display remaining data counts
SELECT 'Data Verification' AS '===================';

SELECT 'Users' AS TableName, COUNT(*) AS RemainingRecords FROM User
UNION ALL
SELECT 'Employees' AS TableName, COUNT(*) AS RemainingRecords FROM Employee
UNION ALL
SELECT 'Departments' AS TableName, COUNT(*) AS RemainingRecords FROM Department
UNION ALL
SELECT 'LeaveTypes' AS TableName, COUNT(*) AS RemainingRecords FROM LeaveType
UNION ALL
SELECT 'LeaveBalances' AS TableName, COUNT(*) AS RemainingRecords FROM LeaveBalance
UNION ALL
SELECT 'LeaveRequests' AS TableName, COUNT(*) AS RemainingRecords FROM LeaveRequest
UNION ALL
SELECT 'Approvals' AS TableName, COUNT(*) AS RemainingRecords FROM Approval
UNION ALL
SELECT 'AuditLogs' AS TableName, COUNT(*) AS RemainingRecords FROM AuditLog
UNION ALL
SELECT 'Holidays' AS TableName, COUNT(*) AS RemainingRecords FROM Holiday
UNION ALL
SELECT 'LeaveProcessHistory' AS TableName, COUNT(*) AS RemainingRecords FROM LeaveProcessHistory
UNION ALL
SELECT 'MonthlyAccruals' AS TableName, COUNT(*) AS RemainingRecords FROM MonthlyAccrual
UNION ALL
SELECT 'CompOffRequests' AS TableName, COUNT(*) AS RemainingRecords FROM CompOffRequest
UNION ALL
SELECT 'Notifications' AS TableName, COUNT(*) AS RemainingRecords FROM Notification;

-- Display Admin user details
SELECT 'Admin User Details' AS '===================';
SELECT
    employeeId,
    firstName,
    lastName,
    email,
    role,
    isActive,
    emailVerified,
    createdAt
FROM User
WHERE role = 'ADMIN' OR employeeId = 'ADMIN';

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- SCRIPT COMPLETED SUCCESSFULLY
-- =====================================================

SELECT 'Environment cleaned successfully!' AS Status;
SELECT 'Admin login is intact and ready to use' AS Note;
SELECT 'Master data (Departments, LeaveTypes) preserved' AS Note;
