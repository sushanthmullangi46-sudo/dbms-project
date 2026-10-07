@echo off
TITLE UDR-ORP - Oracle Database Setup and Reset Tool
echo ====================================================================
echo  URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDR-ORP)
echo  ORACLE XE PASSWORD RESET & DATABASE INITIALIZATION SCRIPT
echo ====================================================================
echo.

set ORACLE_HOME=C:\oraclexe\app\oracle\product\10.2.0\server
set ORACLE_SID=XE
cd /d "%~dp0"

echo [STEP 1/3] Regenerating Oracle Password File (PWDXE.ora)...
if exist "%ORACLE_HOME%\bin\orapwd.exe" (
    "%ORACLE_HOME%\bin\orapwd.exe" file="%ORACLE_HOME%\database\PWDXE.ora" password=oracle force=y
    echo Password file updated successfully.
) else (
    echo Warning: orapwd.exe not found at %ORACLE_HOME%\bin\orapwd.exe
)

echo.
echo [STEP 2/3] Unlocking SYSTEM and SYS accounts in Oracle XE...
(
echo ALTER USER system IDENTIFIED BY oracle ACCOUNT UNLOCK;
echo ALTER USER sys IDENTIFIED BY oracle;
echo GRANT CONNECT, RESOURCE, DBA TO system;
echo exit;
) | "%ORACLE_HOME%\bin\sqlplus.exe" / as sysdba

echo.
echo [STEP 3/3] Initializing 22 Database Tables, Views, Procedures, Triggers & Sample Data...
"%ORACLE_HOME%\bin\sqlplus.exe" system/oracle@localhost:1521/xe @database/init_database.sql

echo.
echo ====================================================================
echo  ORACLE SETUP FINISHED!
echo  Credentials:
echo    Username: system
echo    Password: oracle
echo    Connect String: localhost:1521/xe
echo ====================================================================
echo.
pause
