@echo off
title LESAVOT Desktop Application Launcher
color 0B

echo.
echo ========================================
echo    LESAVOT DESKTOP APPLICATION
echo ========================================
echo    Advanced Steganographic Platform
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Node.js is not installed
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo After installation, restart this script.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version
echo.

REM Navigate to desktop app directory
echo [2/4] Navigating to desktop app directory...
cd /d "%~dp0desktop_app"

if not exist "package.json" (
    echo ❌ ERROR: Desktop app files not found
    echo Please ensure the desktop_app folder exists
    pause
    exit /b 1
)

echo ✅ Desktop app directory found
echo.

REM Install dependencies if needed
echo [3/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing Electron and dependencies...
    echo This may take a few minutes on first run...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Failed to install dependencies
        echo.
        echo Trying alternative installation...
        npm install electron --save-dev
        npm install electron-builder --save-dev
        if %errorlevel% neq 0 (
            echo ❌ Installation failed. Please check your internet connection.
            pause
            exit /b 1
        )
    )
    echo ✅ Dependencies installed successfully!
) else (
    echo ✅ Dependencies already installed
)
echo.

REM Start the desktop application
echo [4/4] Launching LESAVOT Desktop Application...
echo.
echo ========================================
echo    🚀 STARTING LESAVOT DESKTOP...
echo ========================================
echo.
echo The application window will open shortly.
echo Close this window to exit the application.
echo.

npm start

REM Application has closed
echo.
echo ========================================
echo    LESAVOT Desktop Application Closed
echo ========================================
echo.
echo Thank you for using LESAVOT!
echo.
pause
