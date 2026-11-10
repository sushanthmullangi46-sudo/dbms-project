@echo off
title Urban Disaster Relief and Resource Management System (UDRRMS)
color 0B

echo ===============================================================================
echo   URBAN DISASTER RELIEF AND RESOURCE MANAGEMENT SYSTEM (UDRRMS)
echo   13-Stage Sequential Disaster Response Operations Platform
echo ===============================================================================
echo.

echo [1/3] Starting Python FastAPI Database Engine (Port 8000)...
cd /d "%~dp0\backend_py"
start "UDRRMS FastAPI Engine (Port 8000)" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/3] Launching React UI Portal (Port 3000)...
cd /d "%~dp0\frontend"
start "UDRRMS React UI (Port 3000)" cmd /k "npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening UDRRMS Web Application in default browser...
start http://localhost:3000/#/login

echo.
echo ===============================================================================
echo   UDRRMS IS NOW LIVE!
echo   - Frontend Portal:    http://localhost:3000/#/login
echo   - FastAPI Swagger UI: http://127.0.0.1:8000/docs
echo   - FastAPI ReDoc:      http://127.0.0.1:8000/redoc
echo   - Permanent Database: database/udrrms.db (SQLite 3NF Schema)
echo.
echo   PRIMARY DEMO CREDENTIALS (All passwords: password123):
echo   - Role A (Citizen):       citizen@udrrms.com
echo   - Role B (Administrator): officer@udrrms.com (or admin@udrorp.com)
echo   - Role C (Rescue Team):   rescue@udrrms.com
echo   - Support (Logistics):    coordinator@udrrms.com
echo ===============================================================================
pause
