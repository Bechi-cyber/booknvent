@echo off
echo ========================================
echo LESAVOT Deployment Script
echo ========================================
echo.

echo [1/5] Checking Git status...
git status

echo.
echo [2/5] Adding all changes...
git add .

echo.
echo [3/5] Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Deploy LESAVOT web application

git commit -m "%commit_msg%"

echo.
echo [4/5] Pushing to GitHub...
git push origin main

echo.
echo [5/5] Deployment complete!
echo.
echo Your app will be available at:
echo https://bechi-cyber.github.io/FINAL-LESAVOT/
echo.
echo Note: It may take a few minutes for GitHub Pages to update.
echo.
pause
