@echo off
echo ========================================
echo    LESAVOT Desktop Application Launcher
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js detected: 
node --version

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo npm version: 
npm --version
echo.

REM Navigate to desktop app directory
cd /d "%~dp0"

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please ensure you're running this from the desktop_app directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
)

REM Start the application
echo Starting LESAVOT Desktop Application...
echo.
echo ========================================
echo    LESAVOT is now launching...
echo ========================================
echo.

npm start

REM If we get here, the app has closed
echo.
echo LESAVOT Desktop Application has closed.
pause
