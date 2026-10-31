@echo off
setlocal
set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo Run INSTALL.cmd to prepare development dependencies.
  pause
  exit /b 1
)
"node_modules\electron\dist\electron.exe" .
if errorlevel 1 (
  echo The application could not open. Check system requirements.
  pause
  exit /b 1
)
