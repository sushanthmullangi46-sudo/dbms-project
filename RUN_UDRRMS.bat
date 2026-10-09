@echo off
title Urban Disaster Relief and Resource Management System (UDRRMS)
color 0B

echo ===============================================================================
echo   URBAN DISASTER RELIEF AND RESOURCE MANAGEMENT SYSTEM (UDRRMS)
echo   13-Stage Sequential Disaster Response Operations Platform
echo ===============================================================================
echo.

echo [1/3] Verifying Python & FastAPI environment...
cd /d "%~dp0\backend_py"
start "UDRRMS FastAPI Engine (Port 8000)" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/3] Launching React UI (Port 3000)...
cd /d "%~dp0\frontend"
start "UDRRMS React UI (Port 3000)" cmd /k "npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening UDRRMS Web Application in browser...
start http://localhost:3000/#/login

echo.
echo ===============================================================================
echo   UDRRMS IS NOW LIVE!
echo   - Frontend Portal:    http://localhost:3000/#/login
echo   - FastAPI Swagger UI: http://127.0.0.1:8000/docs
echo   - FastAPI ReDoc:      http://127.0.0.1:8000/redoc
echo.
echo   DEMO CREDENTIALS:
echo   - Role 1 (Citizen):    citizen@udrrms.com     / password123
echo   - Role 2 (Officer):    officer@udrrms.com     / password123
echo   - Role 3 (Logistics):  coordinator@udrrms.com / password123
echo ===============================================================================
pause
