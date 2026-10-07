@echo off
title UDR-ORP Emergency Response Platform
color 0A
echo ============================================================
echo   URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM
echo   Starting UDR-ORP System on http://localhost:5000 ...
echo ============================================================
echo.
cd /d "%~dp0backend"

:: Automatically launch browser after 2 seconds in background
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5000"

:: Start the application server
node server.js
pause
