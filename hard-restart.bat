@echo off
echo ===================================================
echo   HARD RESTART SCRIPT FOR PEERGRADE BACKEND
echo ===================================================
echo.
echo 1. Killing all Node.js processes to remove stale servers...
taskkill /F /IM node.exe
echo.
echo 2. Waiting for ports to clear...
timeout /t 3 /nobreak
echo.
echo 3. Starting Backend...
cd backend
npm run dev
pause
