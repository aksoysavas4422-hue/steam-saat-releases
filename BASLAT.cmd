@echo off
setlocal
set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo Once KUR.cmd dosyasini calistirin.
  pause
  exit /b 1
)
"node_modules\electron\dist\electron.exe" .
if errorlevel 1 (
  echo Uygulama acilamadi. Kurulum ve sistem gereksinimlerini kontrol edin.
  pause
  exit /b 1
)
