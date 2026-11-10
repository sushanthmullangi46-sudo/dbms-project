@echo off
title UDR-ORP Emergency Response Platform
color 0A
echo ============================================================
echo   URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM
echo   Starting Unified UDR-ORP System on http://localhost:5000 ...
echo ============================================================
echo.
cd /d "%~dp0backend"

:: Automatically launch browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000"

:: Start the application server (auto-connects to persistent SQLite database)
node server.js
pause
