@echo off
title CareCircle — Full Stack Healthcare Platform
echo ========================================================
echo  CareCircle — Better Care. Together.
echo  Starting Backend (FastAPI) and Frontend (Vite + React)
echo ========================================================

echo Starting Backend on http://localhost:8000 ...
start "CareCircle Backend" cmd /k "cd /d %~dp0backend && set PYTHONPATH=. && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend on http://localhost:5173 ...
start "CareCircle Frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo Both services are starting:
echo  - Frontend Web UI:  http://localhost:5173
echo  - Backend API:      http://localhost:8000
echo  - Swagger Docs:     http://localhost:8000/docs
echo.
pause
