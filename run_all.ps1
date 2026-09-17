Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting CartFlow Support Desk (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& .\.venv\Scripts\python.exe -m uvicorn src.agent.main:app --host 127.0.0.1 --port 8000 --reload"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both services launched in separate windows!" -ForegroundColor Green
