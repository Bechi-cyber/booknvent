@echo off
echo Starting LESAVOT Multimodal Steganography Web Application...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in your PATH.
    echo Please install Python from https://www.python.org/downloads/
    echo.
    echo Alternatively, you can open the application directly:
    echo 1. Open the 'run_web_app.html' file in your web browser
    echo.
    pause
    exit /b 1
)

REM Run the Python server script
python start_local_server.py

pause
