@echo off
echo =============================================
echo MySQL User Resource Limit Reset
echo =============================================
echo.

echo This will remove the query limit for lms_admin user
echo.
echo You will need to enter your MySQL root password
echo.
pause

REM Connect to MySQL and run the commands
mysql -u root -p -e "ALTER USER 'lms_admin'@'%%' WITH MAX_QUERIES_PER_HOUR 0; FLUSH PRIVILEGES; SELECT User, max_questions FROM mysql.user WHERE User = 'lms_admin';"

echo.
echo =============================================
echo Done! max_questions should show 0 (unlimited)
echo =============================================
pause
