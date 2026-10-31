@echo off
setlocal
cd /d "%~dp0"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 veya ustu, npm dahil kurulu olmali.
  echo https://nodejs.org/en/download adresinden Windows kurulumunu yapin.
  pause
  exit /b 1
)
if exist package-lock.json (
  call npm.cmd ci --ignore-scripts --no-audit --no-fund
) else (
  call npm.cmd install --ignore-scripts --no-audit --no-fund
)
if errorlevel 1 goto fail
rem Only Electron's required, explicit runtime download script is executed.
node node_modules\electron\install.js
if errorlevel 1 goto fail
call npm.cmd run check
if errorlevel 1 goto fail
call npm.cmd test
if errorlevel 1 goto fail
echo Kurulum ve testler tamamlandi. BASLAT.cmd dosyasini acabilirsiniz.
pause
exit /b 0
:fail
echo Kurulum veya test basarisiz. Uygulamayi baslatmadan once hatayi duzeltin.
pause
exit /b 1
