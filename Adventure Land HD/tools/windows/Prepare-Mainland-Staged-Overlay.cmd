@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%Prepare-Mainland-Staged-Overlay.ps1" %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Adventure Land HD staged overlay failed with exit code %EXIT_CODE%.
)
exit /b %EXIT_CODE%
