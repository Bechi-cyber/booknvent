@echo off
echo Uploading web application to GitHub...

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Git is not installed or not in your PATH. Please install Git and try again.
    exit /b 1
)

REM Configuration
set REPO_URL=https://github.com/Bechi-cyber/FINAL-LESAVOT.git
set WEB_APP_FOLDER=web_version
set COMMIT_MESSAGE="Add web-based steganography application"

REM Create a temporary directory
if exist temp_web_app rmdir /s /q temp_web_app
mkdir temp_web_app

REM Copy web app files
echo Copying web application files...
xcopy /s /e /y %WEB_APP_FOLDER%\* temp_web_app\
copy /y run_web_app.html temp_web_app\

REM Initialize git repository
echo Initializing git repository...
cd temp_web_app
git init

REM Add files to git
echo Adding files to git...
git add .

REM Commit changes
echo Committing changes...
git commit -m %COMMIT_MESSAGE%

REM Add remote repository
echo Adding remote repository...
git remote add origin %REPO_URL%

REM Push to GitHub
echo Pushing to GitHub...
git push -u origin master --force

REM Clean up
echo Cleaning up...
cd ..
rmdir /s /q temp_web_app

echo Upload complete! Your web application is now available on GitHub.
echo Repository URL: %REPO_URL%

pause
