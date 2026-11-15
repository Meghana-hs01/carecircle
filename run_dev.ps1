# CareCircle PowerShell One-Click Launch Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " CareCircle — Better Care. Together." -ForegroundColor Cyan
Write-Host " Starting Backend (FastAPI) and Frontend (Vite + React)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start backend in a new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\backend'; `$env:PYTHONPATH='.'; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Start frontend in a new process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\frontend'; npm.cmd run dev"

Write-Host ""
Write-Host "Services started:" -ForegroundColor Green
Write-Host " - Frontend:    http://localhost:5173" -ForegroundColor Yellow
Write-Host " - Backend API: http://localhost:8000" -ForegroundColor Yellow
Write-Host " - Swagger API: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
