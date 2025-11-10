-- Reset MySQL user resource limits immediately
-- Run this in MySQL Workbench or command line

-- Option 1: Flush user resources (resets counters immediately)
FLUSH USER_RESOURCES;

-- Option 2: Check current limits for lms_admin user
SELECT User, Host, max_questions, max_updates, max_connections, max_user_connections
FROM mysql.user
WHERE User = 'lms_admin';

-- Option 3: Increase the max_questions limit to 10,000 per hour
ALTER USER 'lms_admin'@'%' WITH MAX_QUERIES_PER_HOUR 10000;
FLUSH PRIVILEGES;

-- Option 4: Remove the limit entirely (set to 0 = unlimited)
ALTER USER 'lms_admin'@'%' WITH MAX_QUERIES_PER_HOUR 0;
FLUSH PRIVILEGES;

-- Option 5: Check if limit was applied successfully
SHOW GRANTS FOR 'lms_admin'@'%';
