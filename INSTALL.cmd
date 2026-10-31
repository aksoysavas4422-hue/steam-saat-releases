@echo off
setlocal
cd /d "%~dp0"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Development requires Node.js 22 or newer with npm.
  echo End users should download SteamHours.exe from GitHub Releases.
  pause
  exit /b 1
)
call npm.cmd ci --ignore-scripts --no-audit --no-fund
if errorlevel 1 goto fail
node node_modules\electron\install.js
if errorlevel 1 goto fail
call npm.cmd run check
if errorlevel 1 goto fail
call npm.cmd test
if errorlevel 1 goto fail
echo Development dependencies are ready. Run START.cmd.
pause
exit /b 0
:fail
echo Dependency installation or checks failed. Resolve the error before starting.
pause
exit /b 1
