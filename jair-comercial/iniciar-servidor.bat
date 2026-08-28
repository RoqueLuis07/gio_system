@echo off
title Jair Comercial - Servidor
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js instalado en esta computadora.
  echo Descargalo de https://nodejs.org/ ^(version LTS^), instalalo, y volve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando lo necesario para arrancar por primera vez, esto puede tardar un minuto...
  echo.
  call npm install
  echo.
)

echo ============================================
echo   JAIR COMERCIAL
echo ============================================
echo   Sitio publico:  http://localhost:4100/
echo   Panel admin:    http://localhost:4100/admin/
echo.
echo   No cierres esta ventana mientras lo uses.
echo   Para apagarlo: cerra esta ventana.
echo ============================================
echo.

start "" /min powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:4100/admin/'"

node server.js

echo.
echo El servidor se detuvo.
pause
