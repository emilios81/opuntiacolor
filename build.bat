@echo off
rem Recompila src/app.jsx a app.js (necesario despues de editar el codigo fuente)
cd /d "%~dp0"
node build.js
pause
