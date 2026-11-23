@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Site 11legia - lanceur
call :trouver_node
if errorlevel 1 exit /b 1

echo Arret des anciens serveurs eventuels...
call "%~dp0arreter-site-local.bat" silencieux

echo Generation de data.js...
node build.js
if errorlevel 1 (echo. & echo Erreur dans build.js : voir ci-dessus. & pause & exit /b 1)

start "11legia - admin (port 8081)" cmd /k "npx -y decap-server"
start "11legia - site (port 3000)" cmd /k "npx -y serve -l 3000 ."
start "11legia - build auto" cmd /k "node build.js --watch"

echo Demarrage...
timeout /t 6 /nobreak >nul
start "" http://localhost:3000/admin/
start "" http://localhost:3000/
echo.
echo Site  : http://localhost:3000/
echo Admin : http://localhost:3000/admin/
echo.
echo Trois fenetres sont ouvertes (admin, site, build auto). Laissez-les ouvertes.
echo Apres une publication dans l admin, rafraichissez simplement le site.
echo Pour tout arreter : arreter-site-local.bat
echo.
pause
exit /b 0

:trouver_node
set "NODEDIR="
for /f "delims=" %%f in ('dir /b /s "%~dp0node\node.exe" 2^>nul') do if not defined NODEDIR set "NODEDIR=%%~dpf"
if not defined NODEDIR goto :node_systeme
set "PATH=%NODEDIR%;%PATH%"
exit /b 0
:node_systeme
where node >nul 2>nul && exit /b 0
echo Node.js introuvable : ni dans le dossier node\ ni installe sur le PC.
pause
exit /b 1
