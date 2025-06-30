@echo off
echo Running LESAVOT Git Sync Script...
powershell -ExecutionPolicy Bypass -File "%~dp0git-sync.ps1"
pause
