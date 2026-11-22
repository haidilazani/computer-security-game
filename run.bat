@echo off
REM ====================================================
REM  CyberQuest - CSC662 Computer Security Learning Game
REM  Double-click this file to start the game.
REM ====================================================
cd /d "%~dp0"

echo Installing dependencies (first run only)...
python -m pip install -r requirements.txt >nul 2>&1

echo.
echo Starting CyberQuest...
echo Open your browser at  http://127.0.0.1:5000
echo Press Ctrl+C in this window to stop the server.
echo.
python app.py
pause
