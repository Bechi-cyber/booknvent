@echo off
echo Setting up scheduled Git sync for LESAVOT project...
powershell -ExecutionPolicy Bypass -File "%~dp0setup-scheduled-sync.ps1"
pause
