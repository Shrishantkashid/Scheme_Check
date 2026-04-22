@echo off
echo ==========================================
echo    SchemesCheck - Starting All Services
echo ==========================================

:: Start the backend server in a new window
echo [SERVER] Starting Backend on Port 5000...
start "SchemesCheck Backend" cmd /k "cd backend && node server.js"

:: Start the Expo development server
echo [FRONTEND] Starting Expo Developer Tools...
npm start

pause
