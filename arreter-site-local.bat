@echo off
chcp 65001 >nul
rem Arrete l admin (8081), le site (3000) et le build automatique.
for %%p in (3000 8081) do for /f "tokens=5" %%i in ('netstat -ano ^| findstr /r /c:":%%p .*LISTENING"') do taskkill /PID %%i /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq 11legia - *" /T /F >nul 2>nul
if /i not "%~1"=="silencieux" (echo Serveurs locaux arretes. & timeout /t 2 >nul)
exit /b 0
