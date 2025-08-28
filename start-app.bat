@echo off
echo Starting AJ Import Application...
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm start"
cd ..

echo.
echo Starting Frontend Server...
cd frontend
start "Frontend Server" cmd /k "npm start"
cd ..

echo.
echo Both servers are starting...
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
