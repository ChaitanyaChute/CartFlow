@echo off
echo ===================================================
echo Starting CartFlow FastAPI Backend on http://127.0.0.1:8000
echo ===================================================
.\.venv\Scripts\python.exe -m uvicorn src.agent.main:app --host 127.0.0.1 --port 8000 --reload
