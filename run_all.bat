@echo off
echo ===================================================
echo Starting CartFlow Support Desk (Backend + Frontend)
echo ===================================================
echo Backend will be available at: http://127.0.0.1:8000
echo Frontend will be available at: http://localhost:3000
echo ===================================================

start "CartFlow Backend (FastAPI)" cmd /k ".\.venv\Scripts\python.exe -m uvicorn src.agent.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "CartFlow Frontend (Next.js)" cmd /k "cd frontend2 && npm run dev"

echo Both services launched in separate windows!
